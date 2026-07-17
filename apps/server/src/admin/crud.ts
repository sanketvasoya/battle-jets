import { PrismaClient } from '@prisma/client';

type PrismaModelDelegate = {
  findMany: (args?: any) => Promise<any[]>;
  findUnique: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
};

export interface CrudConfig {
  model: PrismaModelDelegate;
  entityType: string;
  trackVersion?: boolean;
  include?: Record<string, boolean>;
  orderBy?: Record<string, string>;
}

export interface CrudOps {
  prisma: PrismaClient;
  trackVersion: (entityType: string, entityId: string, entityName: string, data: Record<string, unknown>) => Promise<any>;
}

export function createCrud(config: CrudConfig, ops: CrudOps) {
  const { model, entityType, trackVersion = false, include, orderBy } = config;

  async function maybeVersion(result: any) {
    if (trackVersion) {
      await ops.trackVersion(entityType, result.id, result.name || '', result as any);
    }
  }

  return {
    async findAll(where?: Record<string, any>) {
      return model.findMany({ where, include, orderBy: orderBy || { createdAt: 'desc' } });
    },

    async findById(id: string) {
      return model.findUnique({ where: { id }, include });
    },

    async create(data: Record<string, any>) {
      const result = await model.create({ data, include });
      await maybeVersion(result);
      return result;
    },

    async update(id: string, data: Record<string, any>) {
      const result = await model.update({ where: { id }, data, include });
      await maybeVersion(result);
      return result;
    },

    async remove(id: string) {
      return model.delete({ where: { id } });
    },
  };
}
