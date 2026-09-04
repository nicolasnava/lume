import { redirect } from 'next/navigation'

interface EstudioMemberRedirectProps {
  params: Promise<{
    slug: string
    profissionalSlug: string
  }>
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function EstudioMemberRedirectPage({ params }: EstudioMemberRedirectProps) {
  const { slug, profissionalSlug } = await params
  redirect(`/studio/${slug}/${profissionalSlug}`)
}
