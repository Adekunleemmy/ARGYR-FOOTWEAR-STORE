import { Request, Response, NextFunction } from 'express';
import { PrismaClient, CustomRequestStatus } from '@prisma/client';
import { CustomRequestCreateSchema, CustomRequestStatusUpdateSchema } from '../schemas/zodSchemas';
import { formatCustomRequestWhatsAppMessage, generateWhatsAppUrl } from '../utils/whatsappHelper';
import { config } from '../config';
import { isCloudinaryConfigured, uploadToCloudinary } from '../utils/cloudinaryHelper';

const prisma = new PrismaClient();

/**
 * Public: Submit a guest custom shoe request (supports up to 5 reference image uploads)
 */
export async function createCustomRequest(req: any, res: Response, next: NextFunction) {
  try {
    // 1. Validate inputs (Zod schema parses strings from multipart/form-data)
    const bodyData = {
      ...req.body,
      // Parse quantity as integer
      quantity: req.body.quantity ? Number(req.body.quantity) : 1,
    };
    
    const validatedData = CustomRequestCreateSchema.parse(bodyData);
    // 2. Upload reference images to Cloudinary (if configured) or local folder
    const files = req.files as Express.Multer.File[] || [];
    const uploadedUrls: string[] = [];

    if (files.length > 0) {
      for (const file of files) {
        let fileUrl = `/uploads/${file.filename}`;
        if (isCloudinaryConfigured()) {
          try {
            const cloudinaryResult = await uploadToCloudinary(file.path);
            fileUrl = cloudinaryResult.url;
          } catch (e) {
            console.error("Cloudinary request upload failure:", e);
          }
        }
        uploadedUrls.push(fileUrl);
      }
    }

    // 3. Generate custom request reference code
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const requestReference = `ARGYR-CUSTOM-${randomCode}`;

    // 4. Save request in database transaction
    const request = await prisma.$transaction(async (tx) => {
      const newRequest = await tx.customRequest.create({
        data: {
          requestReference,
          customerName: validatedData.customerName,
          customerPhone: validatedData.customerPhone,
          customerEmail: validatedData.customerEmail,
          productId: validatedData.productId,
          categoryName: validatedData.categoryName,
          gender: validatedData.gender,
          shoeSize: validatedData.shoeSize,
          preferredColour: validatedData.preferredColour,
          preferredMaterial: validatedData.preferredMaterial,
          quantity: validatedData.quantity,
          description: validatedData.description,
          additionalNotes: validatedData.additionalNotes,
          country: validatedData.country,
          city: validatedData.city,
          deliveryAddress: validatedData.deliveryAddress,
          status: CustomRequestStatus.NEW
        }
      });

      if (uploadedUrls.length > 0) {
        const imagesData = uploadedUrls.map(url => ({
          customRequestId: newRequest.id,
          url
        }));
        await tx.customRequestImage.createMany({
          data: imagesData
        });
      }

      return tx.customRequest.findUnique({
        where: { id: newRequest.id },
        include: { images: true }
      });
    });

    if (!request) {
      throw new Error("Failed to process custom request transaction.");
    }

    // 4. Retrieve reference product name if specified
    let referenceProductName: string | null = null;
    if (request.productId) {
      const prod = await prisma.product.findUnique({ where: { id: request.productId } });
      referenceProductName = prod ? prod.name : null;
    }

    // 5. Build prefilled WhatsApp message
    const formattedMsg = formatCustomRequestWhatsAppMessage(request, referenceProductName);

    // 6. Get business WhatsApp number from settings
    const whatsappSetting = await prisma.setting.findUnique({
      where: { key: "WHATSAPP_BUSINESS_NUMBER" }
    });
    const whatsappNumber = whatsappSetting?.value || config.DEFAULT_WHATSAPP_NUMBER;

    const whatsappUrl = generateWhatsAppUrl(whatsappNumber, formattedMsg);

    res.status(201).json({
      success: true,
      message: "Custom request submitted successfully",
      request: {
        id: request.id,
        requestReference: request.requestReference,
        whatsappUrl
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Get all custom requests
 */
export async function adminGetCustomRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const requests = await prisma.customRequest.findMany({
      include: {
        images: true,
        referenceProduct: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, requests });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Get single custom request details
 */
export async function adminGetCustomRequestDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const request = await prisma.customRequest.findUnique({
      where: { id },
      include: {
        images: true,
        referenceProduct: true
      }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: "Custom request not found" });
    }

    res.status(200).json({ success: true, request });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update custom request review status
 */
export async function adminUpdateCustomRequestStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = CustomRequestStatusUpdateSchema.parse(req.body);

    const request = await prisma.customRequest.update({
      where: { id },
      data: { status }
    });

    res.status(200).json({ success: true, message: `Custom request status updated to ${status}`, request });
  } catch (err) {
    next(err);
  }
}
