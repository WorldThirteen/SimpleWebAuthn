import { BaseMetadataService } from './metadataService';

describe('Get known aaguid metadata statement for live metadata BLOB', () => {
  test('should return actual statement for a known aagiud', async () => {
    const service = new BaseMetadataService();

    await service.initialize();

    // well-known aaguid
    const statement = await service.getStatement('ee882879-721c-4913-9775-3dfcce97072a');

    expect(statement).toBeDefined();
  });
});
