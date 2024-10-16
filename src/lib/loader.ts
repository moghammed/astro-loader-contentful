import * as contentful from 'contentful';
import type {
  EntryCollection,
  EntrySkeletonType,
  ContentfulClientApi,
  ContentType,
  ContentTypeField,
  EntriesQueries,
} from 'contentful';

import type { Loader, LoaderContext } from 'astro/loaders';
import z from 'zod';

export type loaderArgs = {
  space: string;
  environment?: string;
  apiKey: string;
  contentTypeId: string;
  preview: boolean;
  queryOptions?: EntriesQueries<EntrySkeletonType, unknown>;
};

const generateZodSchema = async (
  client: ContentfulClientApi<undefined>,
  contentTypeId: string
) => {
  const contentType: ContentType = await client.getContentType(contentTypeId);
  const schemaObj: { [key: string]: any } = {};

  contentType.fields.forEach((field: ContentTypeField) => {
    switch (field.type) {
      case 'Symbol':
      case 'Text':
        schemaObj[field.id] = z.string();
        break;
      case 'Integer':
      case 'Number':
        schemaObj[field.id] = z.number();
        break;
      case 'Boolean':
        schemaObj[field.id] = z.boolean();
        break;
      case 'Date':
        schemaObj[field.id] = z.string().datetime();
        break;
      case 'Location':
        schemaObj[field.id] = z.object({
          lat: z.number(),
          lon: z.number(),
        });
        break;
      case 'Link':
        if (field.linkType === 'Asset') {
          schemaObj[field.id] = z.object({
            fields: z.object({
              file: z.object({
                url: z.string(),
                details: z.object({
                  size: z.number(),
                  image: z
                    .object({
                      width: z.number(),
                      height: z.number(),
                    })
                    .optional(),
                }),
                fileName: z.string(),
                contentType: z.string(),
              }),
            }),
          });
        } else {
          schemaObj[field.id] = z.object({
            sys: z.object({
              id: z.string(),
            }),
          });
        }
        break;
      case 'Array':
        schemaObj[field.id] = z.array(z.any());
        break;
      default:
        schemaObj[field.id] = z.any();
    }

    if (!field.required) {
      schemaObj[field.id] = schemaObj[field.id].optional();
    }
  });

  return z.object(schemaObj);
};

export const loader = ({
  space,
  environment,
  apiKey,
  contentTypeId,
  preview = false,
  queryOptions = {},
}: loaderArgs): Loader => {
  const client = contentful.createClient({
    accessToken: apiKey,
    space,
    environment,
    host: preview ? 'preview.contentful.com' : 'cdn.contentful.com',
  });

  return {
    name: 'astro-loader-contentful',
    load: async (context: LoaderContext) => {
      const entries: EntryCollection<EntrySkeletonType> =
        await client.getEntries<EntrySkeletonType>({
          content_type: contentTypeId,
          ...queryOptions,
        });

      entries.items.forEach((item: any) => {
        context.store.set({
          id: item.sys.id,
          data: item.fields,
        });
      });

      return;
    },
    schema: () => generateZodSchema(client, contentTypeId),
  };
};
