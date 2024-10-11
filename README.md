# Astro Loader for Contentful

This project provides a custom loader for Astro that integrates with Contentful, allowing you to easily fetch and use Contentful data in your Astro projects.

## Features

- Seamless integration with Contentful API
- Automatic schema generation based on Contentful content types
- Support for preview and production environments
- Type-safe data handling using Zod schemas

## Installation

To install the Astro Loader for Contentful, run the following command in your project directory:

`npm i -s astro-loader-contentful`

## Usage

Here's an example of how to use the Astro Loader for Contentful in your Astro project:

In `src/content/config.ts`, add collections and use the loader:

```typescript
import contentfulLoader from 'astro-loader-contentful';
import type { Loader } from 'astro/loaders';

const apiKey = 'your-api-key';
const previewKey = 'your-preview-key'; //this is only needed if you want to show unpublished entries
const environment = 'master';
const space = 'your-space';

const pages = defineCollection({
  loader: contentfulLoader({
    contentTypeId: 'page',
    environment,
    apiKey,
    space,
    preview: false,
    queryOptions: {
      limit: 200,
    },
  }) as Loader,
});

const examples = defineCollection({
  loader: contentfulLoader({
    contentTypeId: 'example',
    environment,
    apiKey: previewKey,
    space,
    preview: true,
  }) as Loader,
});

export const collections = {
  pages,
  examples,
};
```

Now that the collection is defined, we can use it as content. For example, create a file `src/pages/index.astro` with the following content:

```typescript
---
import { getCollection } from "astro:content";
import { documentToHtmlString } from "@contentful/rich-text-html-renderer";

const pages = await getCollection("pages");

---

<Layout title="Contentful Loader Example">
  <main>
    {pages.map(page => (<article>
      <h1 class="page-title">{page.data.fields.title}</h1>
      <Fragment
        set:html={documentToHtmlString(page.data.fields.body)}
        class="page-body"
      />
    </article>))}
  </main>
</Layout>
```
