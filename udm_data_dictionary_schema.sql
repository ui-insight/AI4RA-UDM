CREATE TABLE DataDictionary (
    entity_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, -- Changed IDENTITY to AUTO_INCREMENT for MySQL compatibility
    entity_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    description VARCHAR(1000),
    synonyms VARCHAR(1000),
    context VARCHAR(1000),
    notes VARCHAR(2000),
    category VARCHAR(255),
    sensitivity VARCHAR(100),
    -- Using TIMESTAMP with default values is the MySQL-native way for audit columns
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
