-- TRIPAN V8: exact destination image mapping
-- These URLs correspond to the named destinations.
UPDATE public.destinations SET image_url = CASE name
  WHEN 'Ahmedabad' THEN 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Sabarmati_riverside.jpg'
  WHEN 'Araku Valley' THEN 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Araku-valley.jpg'
  WHEN 'Darjeeling' THEN 'https://upload.wikimedia.org/wikipedia/commons/9/96/DarjeelingTrainFruitshop_%282%29.jpg'
  WHEN 'Gangtok' THEN 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Kangch-Goechala.jpg'
  WHEN 'Goa' THEN 'https://upload.wikimedia.org/wikipedia/commons/f/fc/BeachFun.jpg'
  WHEN 'Hyderabad' THEN 'https://upload.wikimedia.org/wikipedia/commons/8/88/Downtown_hyderabad_drone.png'
  WHEN 'Jaipur' THEN 'https://upload.wikimedia.org/wikipedia/commons/4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg'
  WHEN 'Manali' THEN 'https://upload.wikimedia.org/wikipedia/commons/0/03/Manali_City.jpg'
  WHEN 'Mumbai' THEN 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Mumbai_Bandra-Worli_Sea_Link.jpg'
  WHEN 'Munnar' THEN 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Munnar_Overview.jpg'
  WHEN 'Mysuru' THEN 'https://upload.wikimedia.org/wikipedia/commons/5/56/Mysuru_Montage.jpg'
  WHEN 'New Delhi' THEN 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Forecourt%2C_Rashtrapati_Bhavan_-_1.jpg'
  WHEN 'Ooty' THEN 'https://upload.wikimedia.org/wikipedia/commons/d/db/Ooty_lake.jpg'
  WHEN 'Puri' THEN 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Shri_Jagannatha_Temple.jpg'
  WHEN 'Rishikesh' THEN 'https://upload.wikimedia.org/wikipedia/commons/7/74/Trayambakeshwar_Temple_VK.jpg'
  WHEN 'Shillong' THEN 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Elephant_Falls_II%2C_Shillong.jpg'
  WHEN 'Srinagar' THEN 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Red_and_Yellow_Tulips.JPG'
  WHEN 'Visakhapatnam' THEN 'https://upload.wikimedia.org/wikipedia/commons/5/55/What_is_Shipyard.jpg'
  ELSE image_url END
WHERE name IN ('Ahmedabad','Araku Valley','Darjeeling','Gangtok','Goa','Hyderabad','Jaipur','Manali','Mumbai','Munnar','Mysuru','New Delhi','Ooty','Puri','Rishikesh','Shillong','Srinagar','Visakhapatnam');
