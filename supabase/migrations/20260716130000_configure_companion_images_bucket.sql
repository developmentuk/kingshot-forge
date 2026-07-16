-- Configure the shared public Companion media bucket.
-- Uploads are performed through trusted server-side endpoints so browser
-- clients never receive service-role credentials.

update storage.buckets
set public = true,
    file_size_limit = 2097152,
    allowed_mime_types = array[
      'image/webp',
      'image/png',
      'image/jpeg'
    ]::text[]
where id = 'companion-images';
