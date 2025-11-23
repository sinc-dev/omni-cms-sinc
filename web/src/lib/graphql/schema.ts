/**
 * GraphQL Schema Definition
 * 
 * This defines the GraphQL schema for the Omni-CMS API.
 * Uses GraphQL with code generation for type safety.
 */

export const typeDefs = `
  scalar DateTime
  scalar JSON

  type Organization {
    id: ID!
    name: String!
    slug: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Post {
    id: ID!
    title: String!
    slug: String!
    content: String
    excerpt: String
    status: String!
    publishedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    author: User!
    postType: PostType!
  }

  type PostType {
    id: ID!
    name: String!
    slug: String!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    avatarUrl: String
  }

  type Taxonomy {
    id: ID!
    name: String!
    slug: String!
    isHierarchical: Boolean!
    terms: [TaxonomyTerm!]!
  }

  type TaxonomyTerm {
    id: ID!
    name: String!
    slug: String!
    parentId: ID
  }

  type Media {
    id: ID!
    filename: String!
    mimeType: String!
    fileSize: Int!
    url: String!
    createdAt: DateTime!
  }

  type Query {
    # Posts
    posts(organizationId: ID!, limit: Int, offset: Int, status: String): [Post!]!
    post(organizationId: ID!, postId: ID!): Post
    postBySlug(organizationSlug: String!, postSlug: String!): Post

    # Post Types
    postTypes(organizationId: ID!): [PostType!]!

    # Taxonomies
    taxonomies(organizationId: ID!): [Taxonomy!]!
    taxonomy(organizationId: ID!, taxonomyId: ID!): Taxonomy

    # Media
    media(organizationId: ID!, limit: Int, offset: Int): [Media!]!
    mediaItem(organizationId: ID!, mediaId: ID!): Media
  }

  input CreatePostInput {
    postTypeId: ID!
    title: String!
    slug: String!
    content: String
    excerpt: String
    status: String
    featuredImageId: ID
  }

  input UpdatePostInput {
    title: String
    slug: String
    content: String
    excerpt: String
    status: String
    featuredImageId: ID
  }

  type Mutation {
    # Posts
    createPost(organizationId: ID!, input: CreatePostInput!): Post!
    updatePost(organizationId: ID!, postId: ID!, input: UpdatePostInput!): Post!
    deletePost(organizationId: ID!, postId: ID!): Boolean!

    # Media
    # Note: File uploads via GraphQL are not yet implemented
    # Use REST API endpoint POST /api/admin/v1/organizations/:orgId/media for file uploads
    deleteMedia(organizationId: ID!, mediaId: ID!): Boolean!
  }
`;

