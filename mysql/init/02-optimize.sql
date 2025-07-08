-- Performance optimization settings for webcrawler database
USE webcrawler;

-- Optimize MySQL settings for the application
SET GLOBAL innodb_buffer_pool_size = 134217728; -- 128MB
SET GLOBAL innodb_log_file_size = 50331648; -- 48MB
SET GLOBAL innodb_log_buffer_size = 8388608; -- 8MB
SET GLOBAL innodb_flush_log_at_trx_commit = 1;
SET GLOBAL sync_binlog = 1;

-- Set reasonable timeouts
SET GLOBAL connect_timeout = 60;
SET GLOBAL wait_timeout = 28800;
SET GLOBAL interactive_timeout = 28800;

-- Optimize for concurrent connections
SET GLOBAL max_connections = 100;
SET GLOBAL max_connect_errors = 100;

-- Enable slow query log for monitoring
SET GLOBAL slow_query_log = 1;
SET GLOBAL long_query_time = 2;

-- Create additional indexes after tables exist
-- Note: These will be executed, but tables may not exist yet
-- The application will create proper indexes via GORM

-- Delimiter to handle procedures
DELIMITER $$

-- Create a procedure to add indexes after tables are created
CREATE PROCEDURE IF NOT EXISTS AddOptimalIndexes()
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    -- Ignore errors if tables don't exist yet
  END;
  
  -- Add performance indexes if tables exist
  IF EXISTS (SELECT * FROM information_schema.tables WHERE table_schema = 'webcrawler' AND table_name = 'crawl_results') THEN
    ALTER TABLE crawl_results ADD INDEX IF NOT EXISTS idx_url (url);
    ALTER TABLE crawl_results ADD INDEX IF NOT EXISTS idx_status (status);
    ALTER TABLE crawl_results ADD INDEX IF NOT EXISTS idx_created_at (created_at);
    ALTER TABLE crawl_results ADD INDEX IF NOT EXISTS idx_crawled_at (crawled_at);
    ALTER TABLE crawl_results ADD INDEX IF NOT EXISTS idx_status_created (status, created_at);
  END IF;
  
  IF EXISTS (SELECT * FROM information_schema.tables WHERE table_schema = 'webcrawler' AND table_name = 'broken_links') THEN
    ALTER TABLE broken_links ADD INDEX IF NOT EXISTS idx_crawl_result_id (crawl_result_id);
    ALTER TABLE broken_links ADD INDEX IF NOT EXISTS idx_status_code (status_code);
  END IF;
END$$

DELIMITER ;

-- Call the procedure (will handle errors gracefully)
CALL AddOptimalIndexes();
