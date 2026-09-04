import { redirect } from 'next/navigation'

interface EstudioRedirectProps {
  params: Promise<{
    slug: string
  }>
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function EstudioRedirectPage({ params }: EstudioRedirectProps) {
  const { slug } = await params
  redirect(`/studio/${slug}`)
}
