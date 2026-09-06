import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedCustomerRequest } from '../middleware/customerAuth';
import { CustomerProfileUpdateSchema, CustomerAddressSchema } from '../schemas/zodSchemas';

const prisma = new PrismaClient();

/**
 * 1. Get Customer Profile & Saved Addresses
 */
export async function getProfile(req: AuthenticatedCustomerRequest, res: Response, next: NextFunction) {
  try {
    const customerId = req.customer!.id;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        marketingOptIn: true,
        isEmailVerified: true,
        createdAt: true,
        addresses: {
          orderBy: { isDefault: 'desc' }
        },
        _count: {
          select: { orders: true }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found." });
    }

    res.status(200).json({ success: true, customer });
  } catch (err) {
    next(err);
  }
}

/**
 * 2. Update Customer Profile
 */
export async function updateProfile(req: AuthenticatedCustomerRequest, res: Response, next: NextFunction) {
  try {
    const customerId = req.customer!.id;
    const data = CustomerProfileUpdateSchema.parse(req.body);

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(data.firstName ? { firstName: data.firstName.trim() } : {}),
        ...(data.lastName ? { lastName: data.lastName.trim() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone ? data.phone.trim() : null } : {}),
        ...(data.marketingOptIn !== undefined ? { marketingOptIn: data.marketingOptIn } : {})
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        marketingOptIn: true,
        isEmailVerified: true
      }
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      customer: updated
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 3. Get Authenticated Customer Orders History
 */
export async function getCustomerOrders(req: AuthenticatedCustomerRequest, res: Response, next: NextFunction) {
  try {
    const customerId = req.customer!.id;

    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        items: true,
        payments: {
          select: {
            id: true,
            transactionReference: true,
            amount: true,
            currency: true,
            status: true,
            paymentMethod: true,
            paidAt: true
          }
        },
        statusHistory: {
          select: {
            id: true,
            previousStatus: true,
            newStatus: true,
            customerNote: true, // Only expose customer-facing notes!
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, orders });
  } catch (err) {
    next(err);
  }
}

/**
 * 4. Get Single Order Detail with Ownership Security
 */
export async function getCustomerOrderDetail(req: AuthenticatedCustomerRequest, res: Response, next: NextFunction) {
  try {
    const customerId = req.customer!.id;
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payments: {
          select: {
            id: true,
            transactionReference: true,
            amount: true,
            currency: true,
            status: true,
            paymentMethod: true,
            paidAt: true
          }
        },
        statusHistory: {
          select: {
            id: true,
            previousStatus: true,
            newStatus: true,
            customerNote: true, // Omit internalNote for customer privacy
            createdAt: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    // Authoritative customer ownership check
    if (!order || order.customerId !== customerId) {
      return res.status(404).json({
        success: false,
        message: "Order not found or you do not have permission to view it."
      });
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
}

/**
 * 5. Add Saved Delivery Address
 */
export async function addAddress(req: AuthenticatedCustomerRequest, res: Response, next: NextFunction) {
  try {
    const customerId = req.customer!.id;
    const data = CustomerAddressSchema.parse(req.body);

    if (data.isDefault) {
      // Unset previous defaults
      await prisma.customerAddress.updateMany({
        where: { customerId },
        data: { isDefault: false }
      });
    }

    const address = await prisma.customerAddress.create({
      data: {
        customerId,
        label: data.label?.trim() || null,
        recipientName: data.recipientName.trim(),
        phone: data.phone.trim(),
        country: data.country.trim(),
        stateRegion: data.stateRegion?.trim() || null,
        city: data.city.trim(),
        addressLine: data.addressLine.trim(),
        postalCode: data.postalCode?.trim() || null,
        isDefault: data.isDefault
      }
    });

    res.status(201).json({
      success: true,
      message: "Delivery address saved successfully.",
      address
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 6. Delete Saved Delivery Address
 */
export async function deleteAddress(req: AuthenticatedCustomerRequest, res: Response, next: NextFunction) {
  try {
    const customerId = req.customer!.id;
    const { id } = req.params;

    const address = await prisma.customerAddress.findFirst({
      where: { id, customerId }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found."
      });
    }

    await prisma.customerAddress.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: "Address removed successfully."
    });
  } catch (err) {
    next(err);
  }
}
