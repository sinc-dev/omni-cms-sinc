SELECT id, title, SUBSTR(content, INSTR(content, 'r2.cloudflarestorage.com') - 50, 200) as url_sample FROM posts WHERE content LIKE '%r2.cloudflarestorage.com%' LIMIT 3;
