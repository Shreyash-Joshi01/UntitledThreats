-- Migration 003: Seed zone risk scores

insert into zone_risk_scores (zone_code, city, risk_score, flood_frequency, aqi_frequency, rain_frequency) values
('400001', 'Mumbai',    8.5, 8.0, 3.0, 9.0),
('400051', 'Mumbai',    7.0, 7.0, 2.5, 8.5),
('110001', 'Delhi',     7.5, 5.0, 9.5, 4.0),
('110025', 'Delhi',     7.0, 4.5, 9.0, 4.0),
('560001', 'Bengaluru', 5.5, 4.0, 4.0, 5.5),
('560100', 'Bengaluru', 6.0, 5.0, 3.5, 6.0),
('500001', 'Hyderabad', 7.0, 7.5, 3.0, 6.5),
('500081', 'Hyderabad', 6.5, 6.5, 2.5, 6.0),
('600001', 'Chennai',   6.5, 6.0, 3.5, 7.0),
('411001', 'Pune',      5.0, 4.0, 2.5, 5.5);
