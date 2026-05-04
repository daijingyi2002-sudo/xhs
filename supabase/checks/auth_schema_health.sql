with expected_columns(table_name, column_name) as (
  values
    ('user_profiles', 'id'),
    ('user_profiles', 'email'),
    ('user_profiles', 'display_name'),
    ('user_profiles', 'username'),
    ('user_profiles', 'basic_info'),
    ('user_profiles', 'created_at'),
    ('user_profiles', 'updated_at'),
    ('resumes', 'id'),
    ('resumes', 'user_id'),
    ('resumes', 'file_name'),
    ('resumes', 'file_type'),
    ('resumes', 'file_url'),
    ('resumes', 'parse_status'),
    ('resumes', 'raw_text'),
    ('resumes', 'created_at'),
    ('resumes', 'updated_at'),
    ('user_activity_records', 'id'),
    ('user_activity_records', 'user_id'),
    ('user_activity_records', 'record_type'),
    ('user_activity_records', 'record_key'),
    ('user_activity_records', 'payload'),
    ('user_activity_records', 'created_at'),
    ('user_activity_records', 'updated_at')
)
select
  expected_columns.table_name,
  expected_columns.column_name,
  case when columns.column_name is null then 'missing' else 'ok' end as status
from expected_columns
left join information_schema.columns columns
  on columns.table_schema = 'public'
  and columns.table_name = expected_columns.table_name
  and columns.column_name = expected_columns.column_name
order by expected_columns.table_name, expected_columns.column_name;

select
  schemaname,
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('user_profiles', 'resumes', 'user_activity_records')
order by tablename, policyname;
