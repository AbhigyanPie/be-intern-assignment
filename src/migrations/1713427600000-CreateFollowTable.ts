import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class CreateFollowTable1713427600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'follows',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'followerId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'followingId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // cant follow the same person twice
    await queryRunner.createUniqueConstraint(
      'follows',
      new TableUnique({ columnNames: ['followerId', 'followingId'] })
    );

    await queryRunner.createForeignKey(
      'follows',
      new TableForeignKey({
        columnNames: ['followerId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'follows',
      new TableForeignKey({
        columnNames: ['followingId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('follows');
  }
}
