export const SKILLS: string[] = [
  // Programming Languages
  'Python', 'TypeScript', 'JavaScript', 'Java', 'C++', 'C', 'C#', 'Go', 'Rust',
  'Ruby', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Julia', 'Haskell', 'Erlang',
  'Elixir', 'Clojure', 'F#', 'Dart', 'Lua', 'Perl', 'PHP', 'Groovy', 'COBOL',
  'Fortran', 'Assembly', 'Solidity', 'Move', 'Zig',

  // Web Frameworks & Libraries
  'React', 'Next.js', 'Vue', 'Nuxt.js', 'Angular', 'Svelte', 'SvelteKit', 'Remix',
  'Astro', 'Qwik', 'Solid.js', 'Ember.js', 'Backbone.js', 'jQuery', 'Alpine.js',
  'Express', 'Fastify', 'Koa', 'Hono', 'NestJS', 'Django', 'Flask', 'FastAPI',
  'Rails', 'Sinatra', 'Laravel', 'Symfony', 'Spring Boot', 'Spring MVC', 'Quarkus',
  'Micronaut', 'Ktor', 'Play Framework', 'Phoenix', 'Gin', 'Echo', 'Fiber', 'Chi',
  'Actix', 'Axum', 'Rocket', 'ASP.NET Core', 'Blazor',

  // Mobile
  'React Native', 'Flutter', 'SwiftUI', 'UIKit', 'Jetpack Compose', 'Android SDK',
  'iOS Development', 'Expo', 'Capacitor', 'Ionic', 'Xamarin', 'MAUI',

  // CSS & Styling
  'Tailwind CSS', 'CSS', 'HTML', 'SCSS', 'Sass', 'CSS Modules', 'Styled Components',
  'Emotion', 'Material UI', 'Chakra UI', 'Radix UI', 'shadcn/ui', 'Ant Design',
  'Bootstrap', 'Bulma',

  // Databases
  'PostgreSQL', 'MySQL', 'SQLite', 'SQL Server', 'Oracle DB', 'MongoDB', 'Redis',
  'Cassandra', 'DynamoDB', 'Firestore', 'CockroachDB', 'PlanetScale', 'Supabase',
  'Firebase', 'Fauna', 'Neo4j', 'InfluxDB', 'TimescaleDB', 'Elasticsearch',
  'OpenSearch', 'Pinecone', 'Weaviate', 'Qdrant', 'Chroma',

  // Cloud & Infrastructure
  'AWS', 'GCP', 'Azure', 'Vercel', 'Netlify', 'Cloudflare', 'DigitalOcean', 'Fly.io',
  'Railway', 'Render', 'Heroku', 'Linode', 'Hetzner',

  // DevOps & CI/CD
  'Docker', 'Kubernetes', 'Helm', 'Terraform', 'Pulumi', 'Ansible', 'Chef', 'Puppet',
  'GitHub Actions', 'GitLab CI', 'CircleCI', 'Jenkins', 'ArgoCD', 'Flux',
  'Prometheus', 'Grafana', 'Datadog', 'New Relic', 'PagerDuty', 'Sentry',
  'OpenTelemetry', 'Jaeger', 'Zipkin', 'Vault', 'Consul',

  // AI / ML / Data
  'PyTorch', 'TensorFlow', 'Keras', 'JAX', 'Hugging Face', 'LangChain', 'LlamaIndex',
  'OpenAI API', 'Anthropic API', 'Gemini API', 'Scikit-learn', 'XGBoost', 'LightGBM',
  'CatBoost', 'Pandas', 'NumPy', 'SciPy', 'Matplotlib', 'Seaborn', 'Plotly',
  'Jupyter', 'Spark', 'Hadoop', 'Flink', 'Kafka', 'Airflow', 'Prefect', 'Dagster',
  'dbt', 'Fivetran', 'Airbyte', 'Great Expectations', 'MLflow', 'Weights & Biases',
  'Ray', 'CUDA', 'OpenCV', 'spaCy', 'NLTK', 'Transformers', 'Diffusers',
  'Stable Diffusion', 'Computer Vision', 'NLP', 'Reinforcement Learning',
  'Time Series Analysis', 'A/B Testing', 'Statistical Modeling', 'Data Visualization',

  // APIs & Protocols
  'REST', 'GraphQL', 'gRPC', 'WebSockets', 'WebRTC', 'MQTT', 'AMQP', 'Kafka',
  'RabbitMQ', 'SQS', 'SNS', 'Pub/Sub', 'tRPC', 'OpenAPI', 'Swagger',

  // Security
  'OAuth 2.0', 'JWT', 'SAML', 'LDAP', 'SSO', 'MFA', 'Penetration Testing',
  'OWASP', 'Cryptography', 'TLS/SSL', 'Zero Trust', 'IAM', 'SIEM',
  'Vulnerability Assessment', 'Threat Modeling', 'Security Auditing',
  'Reverse Engineering', 'Malware Analysis', 'Network Security',

  // Testing
  'Jest', 'Vitest', 'Playwright', 'Cypress', 'Selenium', 'Pytest', 'JUnit',
  'Mocha', 'Chai', 'Testing Library', 'Storybook', 'k6', 'Locust', 'Gatling',
  'Contract Testing', 'TDD', 'BDD',

  // Tools & Platforms
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Linear', 'Notion', 'Confluence',
  'Slack', 'VS Code', 'IntelliJ', 'Xcode', 'Linux', 'Bash', 'PowerShell', 'Vim',
  'tmux', 'Neovim', 'Postman', 'Insomnia', 'Wireshark', 'Nginx', 'Apache',
  'Caddy', 'HAProxy', 'Traefik',

  // Design & Product
  'Figma', 'Adobe XD', 'Sketch', 'InVision', 'Zeplin', 'Framer', 'Webflow',
  'Illustrator', 'Photoshop', 'After Effects', 'Premiere Pro', 'Final Cut Pro',
  'UI/UX Design', 'Product Management', 'User Research', 'Usability Testing',
  'Design Systems', 'Wireframing', 'Prototyping', 'Information Architecture',

  // Business & Domain
  'Financial Modeling', 'Valuation', 'Excel', 'Bloomberg Terminal', 'SQL',
  'Tableau', 'Power BI', 'Looker', 'Salesforce', 'HubSpot', 'SAP', 'Workday',
  'Accounting', 'GAAP', 'IFRS', 'FP&A', 'Equity Research', 'Investment Banking',
  'Private Equity', 'Venture Capital', 'Risk Management', 'Derivatives', 'Options',
  'Portfolio Management', 'Quantitative Finance', 'Algorithmic Trading',

  // Science & Engineering
  'CAD', 'SolidWorks', 'AutoCAD', 'ANSYS', 'MATLAB Simulink', 'LabVIEW',
  'PLC Programming', 'Circuit Design', 'PCB Layout', 'FPGA', 'Verilog', 'VHDL',
  'Embedded Systems', 'RTOS', 'CAN Bus', 'ROS', 'Control Systems',
  'Signal Processing', 'Finite Element Analysis', 'Computational Fluid Dynamics',
  'Bioinformatics', 'Clinical Research', 'GCP (Clinical)', 'HIPAA', 'FDA Regulations',
  'Lab Techniques', 'PCR', 'CRISPR', 'Flow Cytometry', 'Mass Spectrometry',

  // Soft Skills
  'Leadership', 'Communication', 'Project Management', 'Agile', 'Scrum', 'Kanban',
  'Cross-functional Collaboration', 'Mentoring', 'Technical Writing', 'Public Speaking',
  'Problem Solving', 'Critical Thinking', 'Data-driven Decision Making',
  'Stakeholder Management', 'Product Strategy', 'Go-to-Market', 'Growth',

  // Languages (human)
  'Spanish', 'Mandarin', 'French', 'German', 'Japanese', 'Korean', 'Arabic',
  'Hindi', 'Portuguese', 'Italian', 'Russian', 'Dutch', 'Swedish',
]
