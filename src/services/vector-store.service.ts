/**
 * Service for managing vector storage and performing operations like adding documents
 * and conducting similarity searches using PGVector and OpenAI embeddings.
 *
 * This service initializes a PostgreSQL connection pool, sets up a vector store using
 * PGVector, and provides methods to add documents to the store and perform similarity
 * searches. It ensures that the necessary database schema and extensions are created
 * during module initialization and properly releases resources on module destruction.
 *
 * @class VectorStoreService
 * @decorator Injectable - Marks the class as a service that can be injected.
 *
 * @property {PGVectorStore} pgvectorStore - The PGVector store instance for storing
 *                                           and searching vectors.
 * @property {pg.Pool} pool - The PostgreSQL connection pool for database operations.
 *
 * @method onModuleInit - Initializes the service by setting up the database schema and
 *                        configuring the PGVector store. It is automatically called by
 *                        NestJS when the module is initialized.
 *
 * @method ensureDatabaseSchema - Ensures the required database schema and extensions
 *                                are present. It creates them if they don't exist.
 *                                This method is private and only called internally.
 *
 * @method addDocuments - Adds an array of documents to the vector store. Each document
 *                        is processed to extract its vector representation before storage.
 *
 * @method similaritySearch - Performs a similarity search in the vector store based on
 *                            a query string and returns the most similar documents up to
 *                            a specified limit.
 *
 * @method onModuleDestroy - Cleans up resources by ending the PostgreSQL pool connection.
 *                           It is automatically called by NestJS when the module is
 *                           destroyed.
 */

import { Injectable } from '@nestjs/common';
import { OpenAIEmbeddings } from '@langchain/openai';
import {
  DistanceStrategy,
  PGVectorStore,
} from '@langchain/community/vectorstores/pgvector';
import * as pg from 'pg';
import { Document } from '@langchain/core/documents';
import { PoolConfig } from 'pg';

@Injectable()
export class VectorStoreService {
  private pgvectorStore: PGVectorStore;
  private pool: pg.Pool;

  async onModuleInit() {
    const { postgresConnectionOptions, tableName, columns, distanceStrategy } =
      config;
    this.pool = new pg.Pool(postgresConnectionOptions);
    await this.ensureDatabaseSchema();

    const pgVectorConfig = {
      pool: this.pool,
      tableName,
      columns,
      distanceStrategy,
    };

    this.pgvectorStore = new PGVectorStore(
      new OpenAIEmbeddings(),
      pgVectorConfig,
    );
  }

  private async ensureDatabaseSchema() {
    const client = await this.pool.connect();
    try {
      // Check and create table and columns
      const query = `
      CREATE TABLE IF NOT EXISTS ${config.tableName} (
        ${config.columns.idColumnName} UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ${config.columns.vectorColumnName} VECTOR,
        ${config.columns.contentColumnName} TEXT,
        ${config.columns.metadataColumnName} JSONB
      );
    `;
      // Create requried extensions first
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      await client.query(query);
    } finally {
      client.release();
    }
  }

  async addDocuments(documents: Document[]): Promise<void> {
    await this.pgvectorStore.addDocuments(documents);
  }

  async similaritySearch(query: string, limit: number): Promise<any> {
    return this.pgvectorStore.similaritySearch(query, limit);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}

// Define the config
const config = {
  postgresConnectionOptions: {
    type: 'postgres',
    host: '127.0.0.1',
    port: 5434,
    user: 'pgvector',
    password: 'admin',
    database: 'pgvector-db',
  } as PoolConfig,
  tableName: 'testlangchain',
  columns: {
    idColumnName: 'id',
    vectorColumnName: 'vector',
    contentColumnName: 'content',
    metadataColumnName: 'metadata',
  },
  distanceStrategy: 'cosine' as DistanceStrategy,
};
