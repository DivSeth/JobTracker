INSERT INTO job_sources (repo_url, repo_name, job_type_tag, is_active) VALUES
  ('https://github.com/SimplifyJobs/New-Grad-Positions', 'SimplifyJobs/New-Grad-Positions', 'new_grad', true),
  ('https://github.com/SimplifyJobs/Summer2025-Internships', 'SimplifyJobs/Summer2025-Internships', 'internship', true)
ON CONFLICT DO NOTHING;
