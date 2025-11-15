-- Currency seed data
-- This script should be run manually on your Render database

INSERT INTO "Currency" (id, cur_symbol, cur_name) VALUES
(1, '$', 'US Dollar'),
(2, '€', 'Euro'),
(3, '£', 'British Pound'),
(4, '¥', 'Japanese Yen'),
(5, '¥', 'Chinese Yuan'),
(6, 'A$', 'Australian Dollar'),
(7, 'C$', 'Canadian Dollar'),
(8, 'CHF', 'Swiss Franc'),
(9, '₹', 'Indian Rupee'),
(10, 'S$', 'Singapore Dollar'),
(11, 'HK$', 'Hong Kong Dollar'),
(12, 'NZ$', 'New Zealand Dollar'),
(13, '₩', 'South Korean Won'),
(14, 'Mex$', 'Mexican Peso'),
(15, 'R$', 'Brazilian Real'),
(16, 'R', 'South African Rand'),
(17, 'kr', 'Swedish Krona'),
(18, 'kr', 'Norwegian Krone'),
(19, 'kr', 'Danish Krone'),
(20, 'zł', 'Polish Zloty'),
(21, '฿', 'Thai Baht'),
(22, 'Rp', 'Indonesian Rupiah'),
(23, 'RM', 'Malaysian Ringgit'),
(24, '₱', 'Philippine Peso'),
(25, '₽', 'Russian Ruble'),
(26, '₺', 'Turkish Lira'),
(27, 'د.إ', 'UAE Dirham'),
(28, '﷼', 'Saudi Riyal'),
(29, '$', 'Argentine Peso'),
(30, '$', 'Chilean Peso')
ON CONFLICT (id) DO NOTHING;

-- Set the sequence to continue from the last inserted ID
SELECT setval(pg_get_serial_sequence('"Currency"', 'id'), (SELECT MAX(id) FROM "Currency"));
