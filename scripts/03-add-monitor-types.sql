-- Add support for different monitor types (HTTP, Ping, Port, Keyword)

-- Add type column with default 'http'
ALTER TABLE monitors 
ADD COLUMN type VARCHAR(20) DEFAULT 'http';

-- Add keyword column for keyword monitoring
ALTER TABLE monitors 
ADD COLUMN keyword TEXT;

-- Add port column for port monitoring
ALTER TABLE monitors 
ADD COLUMN port INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN monitors.type IS 'Monitor type: http, ping, port, or keyword';
COMMENT ON COLUMN monitors.keyword IS 'Keyword to search for in keyword monitoring';
COMMENT ON COLUMN monitors.port IS 'Port number for port monitoring';

-- Set existing monitors to 'http' type explicitly
UPDATE monitors SET type = 'http' WHERE type IS NULL;
