-- O grant de update em interviewers deixa o dono gravar direto pelo client, sem passar
-- pela Server Action que limita os textos. Eles são públicos no marketplace, então o
-- limite precisa valer no banco. Os números são os do interviewerFormSchema
-- (apps/web/app/onboarding/entrevistador/schema.ts); as URLs não têm limite lá, e 200
-- cobre com folga um endereço de perfil.
alter table public.interviewers
  add constraint interviewers_headline_length check (char_length(headline) <= 80),
  add constraint interviewers_company_length check (char_length(company) <= 60),
  add constraint interviewers_bio_length check (bio is null or char_length(bio) <= 500),
  add constraint interviewers_linkedin_url_length
    check (linkedin_url is null or char_length(linkedin_url) <= 200),
  add constraint interviewers_github_url_length
    check (github_url is null or char_length(github_url) <= 200);
