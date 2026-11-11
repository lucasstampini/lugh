-- Bucket pra foto de perfil enviada pela própria pessoa (hoje avatar_url só
-- guarda a foto que veio do Google). Caminho do arquivo é "<user_id>/avatar",
-- então a policy de escrita só precisa comparar o primeiro segmento do
-- caminho com auth.uid(), sem precisar de tabela extra.
-- Limite de tamanho e tipos aceitos valem no próprio bucket: a Server Action
-- valida o mesmo, mas a policy de escrita permite upload direto pelo client.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true, 4194304,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars: owner write own folder" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: owner update own folder" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: owner delete own folder" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
