import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateHashtagTables1713427400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'hashtags',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isUnique: true,
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

    // junction table for posts <-> hashtags
    await queryRunner.createTable(
      new Table({
        name: 'post_hashtags',
        columns: [
          {
            name: 'postId',
            type: 'integer',
            isPrimary: true,
          },
          {
            name: 'hashtagId',
            type: 'integer',
            isPrimary: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'post_hashtags',
      new TableForeignKey({
        columnNames: ['postId'],
        referencedTableName: 'posts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'post_hashtags',
      new TableForeignKey({
        columnNames: ['hashtagId'],
        referencedTableName: 'hashtags',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('post_hashtags');
    await queryRunner.dropTable('hashtags');
  }
}
