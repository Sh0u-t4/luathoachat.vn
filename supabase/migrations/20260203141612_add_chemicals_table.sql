/*
  # Add Chemicals Reference Table

  1. New Tables
    - `chemicals`
      - `id` (uuid, primary key)
      - `name_vi` (text) - Vietnamese name
      - `name_en` (text) - English name
      - `cas_number` (text) - CAS Registry Number
      - `un_number` (text, nullable) - UN Number for transport
      - `ghs_classification` (text) - GHS hazard classification
      - `hazard_pictograms` (text[]) - Array of GHS pictogram codes
      - `license_required` (boolean)
      - `license_type` (text, nullable)
      - `storage_requirements` (text, nullable)
      - `penalty_info` (text, nullable)
      - `msds_url` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Public read access for reference data
    
  3. Sample Data
    - Insert common industrial chemicals with Vietnamese legal requirements
*/

CREATE TABLE IF NOT EXISTS chemicals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_vi text NOT NULL,
  name_en text NOT NULL,
  cas_number text UNIQUE,
  un_number text,
  ghs_classification text,
  hazard_pictograms text[],
  license_required boolean DEFAULT false,
  license_type text,
  storage_requirements text,
  penalty_info text,
  msds_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chemicals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chemicals"
  ON chemicals FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO chemicals (name_vi, name_en, cas_number, un_number, ghs_classification, hazard_pictograms, license_required, license_type, storage_requirements, penalty_info) VALUES
('Axit Clohydric', 'Hydrochloric Acid', '7647-01-0', 'UN1789', 'Corrosive, Acute Toxicity', ARRAY['GHS05', 'GHS07'], true, 'Giấy phép kinh doanh hóa chất', 'Kho riêng biệt, thông gió tốt, tránh ánh sáng mặt trời', 'Phạt 50-100 triệu VND nếu không có giấy phép'),
('Axit Sulfuric', 'Sulfuric Acid', '7664-93-9', 'UN1830', 'Corrosive, Oxidizer', ARRAY['GHS05', 'GHS03'], true, 'Giấy phép kinh doanh hóa chất', 'Kho riêng biệt, chống cháy, thông gió', 'Phạt 100-200 triệu VND nếu vi phạm quy định lưu trữ'),
('Natri Hydroxit', 'Sodium Hydroxide', '1310-73-2', 'UN1823', 'Corrosive', ARRAY['GHS05'], true, 'Giấy phép kinh doanh hóa chất', 'Kho khô ráo, tránh ẩm', 'Phạt 30-50 triệu VND'),
('Methanol', 'Methanol', '67-56-1', 'UN1230', 'Flammable, Acute Toxicity', ARRAY['GHS02', 'GHS06', 'GHS08'], true, 'Giấy phép tiền chất công nghiệp', 'Kho chống cháy nổ, nhiệt độ < 30°C', 'Phạt 200-500 triệu VND nếu không có giấy phép tiền chất'),
('Acetone', 'Acetone', '67-64-1', 'UN1090', 'Flammable, Eye Irritant', ARRAY['GHS02', 'GHS07'], false, NULL, 'Kho thông gió, tránh nguồn lửa', 'Phạt 20-30 triệu VND nếu vi phạm PCCC'),
('Formaldehyde', 'Formaldehyde', '50-00-0', 'UN1198', 'Carcinogenic, Acute Toxicity', ARRAY['GHS06', 'GHS08', 'GHS05'], true, 'Giấy phép hóa chất hạn chế', 'Kho riêng biệt, hệ thống xử lý khí thải', 'Phạt 300-500 triệu VND, có thể truy cứu hình sự'),
('Amoniac', 'Ammonia', '7664-41-7', 'UN1005', 'Acute Toxicity, Corrosive, Environmental Hazard', ARRAY['GHS06', 'GHS05', 'GHS09'], true, 'Giấy phép kinh doanh hóa chất', 'Kho ngoài trời hoặc thông gió cưỡng bức', 'Phạt 100-200 triệu VND'),
('Hydrogen Peroxide 30%', 'Hydrogen Peroxide', '7722-84-1', 'UN2014', 'Oxidizer, Corrosive', ARRAY['GHS03', 'GHS05', 'GHS07'], true, 'Giấy phép tiền chất công nghiệp', 'Kho mát, tránh ánh sáng, chất hữu cơ', 'Phạt 150-300 triệu VND nếu không có giấy phép'),
('Toluen', 'Toluene', '108-88-3', 'UN1294', 'Flammable, Reproductive Toxicity', ARRAY['GHS02', 'GHS07', 'GHS08'], true, 'Giấy phép tiền chất công nghiệp', 'Kho chống cháy, thông gió', 'Phạt 200-400 triệu VND'),
('Xylen', 'Xylene', '1330-20-7', 'UN1307', 'Flammable, Health Hazard', ARRAY['GHS02', 'GHS07', 'GHS08'], false, NULL, 'Kho thông gió, tránh nguồn nhiệt', 'Phạt 30-50 triệu VND');

CREATE INDEX IF NOT EXISTS idx_chemicals_cas ON chemicals(cas_number);
CREATE INDEX IF NOT EXISTS idx_chemicals_name_vi ON chemicals(name_vi);
CREATE INDEX IF NOT EXISTS idx_chemicals_name_en ON chemicals(name_en);
