import { redirect } from 'next/navigation';

export default async function FeedbacksNovoPage({
  searchParams,
}: {
  searchParams?: Promise<{ recipient?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const qs = new URLSearchParams({ novo: '1' });
  if (params.recipient) qs.set('recipient', params.recipient);
  redirect(`/feedbacks?${qs.toString()}`);
}
