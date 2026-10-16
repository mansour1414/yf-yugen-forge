import { prisma } from '../../lib/prisma';
import { ApiError } from '../core/errors/api-error';
import { logActivity } from '../core/logger/activity.logger';
import { getPaginationParams, createPaginationResult } from '../core/pagination/pagination.util';
import { buildPrismaQuery } from '../core/query/query.util';
import { CreateMessageInput, MESSAGE_SORT_FIELDS, UpdateMessageInput } from '../types/message.schema';
import { sendContactEmailCopy } from './email.service';

interface MessageQueryOptions {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  serviceId?: string;
  isRead?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class MessageService {
  private static async findExisting(id: string) {
    const message = await prisma.message.findUnique({
      where: { id },
      include: { service: { select: { id: true, title: true } } },
    });

    if (!message) {
      throw ApiError.notFound('Message not found');
    }

    return message;
  }

  private static async validateService(serviceId?: string | null) {
    if (!serviceId) return;
    const service = await prisma.service.findFirst({
      where: { id: serviceId, active: true, deletedAt: null },
      select: { id: true },
    });
    if (!service) {
      throw ApiError.badRequest('Service not found');
    }
  }

  static async findAll(options: MessageQueryOptions) {
    const { page, limit, skip } = getPaginationParams(options);
    const { where, orderBy } = buildPrismaQuery({
      search: options.search,
      searchFields: ['name', 'email', 'company', 'subject'],
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      sortableFields: MESSAGE_SORT_FIELDS,
      excludeSoftDeleted: false,
      filters: {
        status: options.status,
        serviceId: options.serviceId,
        isRead: options.isRead,
      },
    });

    const [total, messages] = await Promise.all([
      prisma.message.count({ where }),
      prisma.message.findMany({
        where,
        include: { service: { select: { id: true, title: true } } },
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    return { data: messages, pagination: createPaginationResult(total, page, limit) };
  }

  static async findById(id: string, userId: string, ipAddress?: string) {
    const message = await this.findExisting(id);
    if (message.isRead && message.status !== 'NEW') return message;

    const updated = await prisma.message.update({
      where: { id },
      data: { isRead: true, ...(message.status === 'NEW' && { status: 'READ' }) },
      include: { service: { select: { id: true, title: true } } },
    });

    await logActivity({ action: 'UPDATE', entity: 'MESSAGE', entityId: id, userId, ipAddress });
    return updated;
  }

  static async create(input: CreateMessageInput, ipAddress?: string) {
    await this.validateService(input.serviceId);
    const { contactMethod, lang, ...messageData } = input;

    const message = await prisma.message.create({
      data: messageData,
      include: { service: { select: { id: true, title: true } } },
    });

    await logActivity({ action: 'CREATE', entity: 'MESSAGE', entityId: message.id, ipAddress });

    if (contactMethod === 'email') {
      const contactEmailSetting = await prisma.setting.findUnique({ where: { key: 'contact_email' } });
      const toEmail = contactEmailSetting?.value || 'Hello.youssefalfaraj@gmail.com';
      await sendContactEmailCopy({
        toEmail,
        name: message.name,
        email: message.email,
        subject: message.subject,
        budget: message.budget,
        message: message.message,
        lang: lang || 'ar',
      });
    }

    return message;
  }

  /** Client Portal: submit a message as an authenticated client. Name/email
   * are taken from their own trusted Client record, never from the request
   * body, so a client can never impersonate someone else. */
  static async createFromClient(clientId: string, input: { subject?: string; message: string }) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw ApiError.notFound('Client not found');

    const message = await prisma.message.create({
      data: {
        name: client.contactName,
        email: client.email,
        phone: client.phone,
        company: client.companyName,
        subject: input.subject || null,
        message: input.message,
        clientId: client.id,
        source: 'Client Portal',
      },
    });

    await logActivity({ action: 'CREATE', entity: 'MESSAGE', entityId: message.id });
    return message;
  }

  /** Client Portal: this client's own message history. */
  static async findMineForClient(clientId: string, options: { page?: number | string; limit?: number | string }) {
    const { page, limit, skip } = getPaginationParams(options);

    const [total, messages] = await Promise.all([
      prisma.message.count({ where: { clientId } }),
      prisma.message.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { data: messages, pagination: createPaginationResult(total, page, limit) };
  }

  static async update(id: string, input: UpdateMessageInput, userId: string, ipAddress?: string) {
    await this.findExisting(id);
    await this.validateService(input.serviceId);

    const message = await prisma.message.update({
      where: { id },
      data: {
        ...input,
        ...(input.status !== undefined && { isRead: input.status !== 'NEW' }),
      },
      include: { service: { select: { id: true, title: true } } },
    });

    await logActivity({ action: 'UPDATE', entity: 'MESSAGE', entityId: id, userId, ipAddress });
    return message;
  }

  static async remove(id: string, userId: string, ipAddress?: string) {
    await this.findExisting(id);
    await prisma.message.delete({ where: { id } });
    await logActivity({ action: 'DELETE', entity: 'MESSAGE', entityId: id, userId, ipAddress });
    return { success: true };
  }

  static async findServiceOptions() {
    return prisma.service.findMany({
      where: { active: true, deletedAt: null },
      select: { id: true, title: true },
      orderBy: { displayOrder: 'asc' },
    });
  }
}
