import type { MDXComponents } from 'mdx/types'
import Image, { ImageProps } from 'next/image'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <h1 className="text-4xl font-serif font-bold mt-8 mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl font-serif font-semibold mt-8 mb-4">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl font-serif font-medium mt-6 mb-3">{children}</h3>,
    p: ({ children }) => <p className="text-lg leading-relaxed mb-6 text-foreground/80">{children}</p>,
    img: (props) => (
      <Image
        sizes="100vw"
        style={{ width: '100%', height: 'auto' }}
        {...(props as ImageProps)}
      />
    ),
    ...components,
  }
}
