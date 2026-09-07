-- TRIPAN V10: Transport services for all 18 destinations
-- Creates a small, prototype-friendly local transport catalogue.
-- Fares are approximate ranges for planning/demo purposes, not live quotes.
-- Safe to re-run: unique constraint + ON CONFLICT DO NOTHING.

create table if not exists public.transport_options (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  type text not null,
  name text not null,
  fare_range text not null default 'Fare varies',
  location text not null default 'Local area',
  availability text not null default 'Check locally',
  description text not null default 'Useful local travel option.',
  image_url text,
  maps_url text,
  created_at timestamptz not null default now()
);

create unique index if not exists transport_options_destination_name_uq
  on public.transport_options(destination_id, lower(name));

insert into public.transport_options
(destination_id,type,name,fare_range,location,availability,description,image_url,maps_url)
select d.id, s.type, s.name, s.fare_range, s.location, s.availability, s.description, s.image_url,
       'https://www.google.com/maps/search/?api=1&query=' ||
       replace(s.name || ' ' || d.name, ' ', '+')
from public.destinations d
join (values
('Ahmedabad','Public bus','AMTS / Ahmedabad city bus','₹10–₹40','Citywide','Daytime; check route','Affordable city travel for major areas.'),
('Ahmedabad','Auto-rickshaw','Local auto-rickshaw','₹30–₹150+','Citywide','Usually daytime/evening','Convenient for short local trips; confirm fare before travel.'),
('Ahmedabad','Taxi / Cab','App-based taxi / cab','₹100–₹500+','Citywide','Generally available','Useful for point-to-point travel and airport transfers.'),
('Ahmedabad','Metro','Ahmedabad Metro','₹10–₹50','Major metro corridors','Service hours vary','Fast public transport on operational metro corridors.'),
('Ahmedabad','Bike / Scooter rental','Two-wheeler rental','₹300–₹700/day','Tourist and city areas','Availability varies','Useful for independent local sightseeing where legally permitted.'),

('Araku Valley','Public bus','APSRTC / local buses','₹20–₹150+','Araku and nearby areas','Route dependent','Budget option for connecting Araku with nearby towns.'),
('Araku Valley','Train','Araku–Visakhapatnam rail service','₹100–₹300+','Araku railway station','Schedule dependent','Scenic rail connectivity through the Eastern Ghats.'),
('Araku Valley','Taxi / Cab','Local taxi / cab','₹1,000–₹3,000+','Araku and nearby sightseeing','Availability varies','Useful for multi-stop sightseeing outside the main town.'),
('Araku Valley','Auto-rickshaw','Local auto-rickshaw','₹50–₹300+','Araku town','Availability varies','Useful for short trips within the local area.'),
('Araku Valley','Bike / Scooter rental','Two-wheeler rental','₹400–₹800/day','Araku town','Availability varies','Rental availability should be confirmed locally before travel.'),

('Darjeeling','Public bus','Darjeeling local buses','₹20–₹100+','Darjeeling town and nearby routes','Route dependent','Low-cost option for selected local and nearby routes.'),
('Darjeeling','Taxi / Cab','Shared/local taxi','₹100–₹500+','Darjeeling town','Generally available','Shared taxis are useful for popular local routes.'),
('Darjeeling','Train','Darjeeling Himalayan Railway','₹500–₹2,000+','Darjeeling railway area','Schedule dependent','Heritage railway experience; fares vary by service.'),
('Darjeeling','Auto-rickshaw','Local shared auto','₹20–₹150+','Selected routes','Route dependent','Useful on routes where shared autos operate.'),
('Darjeeling','Bike / Scooter rental','Two-wheeler rental','₹500–₹1,000/day','Town and tourist areas','Availability varies','Confirm road and weather conditions before renting.'),

('Gangtok','Public bus','Sikkim Nationalised Transport / local bus','₹20–₹150+','Gangtok and nearby routes','Route dependent','Budget public transport on available routes.'),
('Gangtok','Taxi / Cab','Local taxi / shared taxi','₹100–₹800+','Gangtok and tourist areas','Generally available','Common option for sightseeing and nearby transfers.'),
('Gangtok','Auto-rickshaw','Local shared taxi / auto','₹50–₹250+','Gangtok local area','Availability varies','Useful for short local journeys where available.'),
('Gangtok','Bike / Scooter rental','Two-wheeler rental','₹500–₹1,000/day','Gangtok','Availability varies','Use only where permitted and check road/weather conditions.'),
('Gangtok','Taxi / Cab','Airport / railway transfer cab','₹1,500–₹4,000+','Gangtok to nearby gateways','Pre-book recommended','Useful for longer transfers; fare depends on vehicle and route.'),

('Goa','Public bus','Kadamba Transport buses','₹10–₹80+','Panaji and major routes','Route dependent','Public buses connect many major towns and tourist areas.'),
('Goa','Taxi / Cab','App/local taxi','₹150–₹1,000+','Statewide tourist areas','Generally available','Useful for airport transfers and longer point-to-point journeys.'),
('Goa','Bike / Scooter rental','Scooter rental','₹300–₹800/day','Major tourist areas','Availability varies','Popular local option; carry valid licence and follow local rules.'),
('Goa','Train','Konkan Railway services','₹100–₹1,000+','Madgaon/Thivim and other stations','Schedule dependent','Useful for rail connectivity into and across Goa.'),
('Goa','Ferry','Goa river ferries','₹10–₹50+','Selected river crossings','Service/weather dependent','Low-cost option on operating ferry routes.'),

('Hyderabad','Metro','Hyderabad Metro Rail','₹10–₹70+','Major metro corridors','Service hours vary','Fast public transport connecting major parts of the city.'),
('Hyderabad','Public bus','TGSRTC city buses','₹10–₹100+','Citywide','Route dependent','Affordable city travel across many neighbourhoods.'),
('Hyderabad','Auto-rickshaw','Local auto-rickshaw','₹50–₹300+','Citywide','Generally available','Useful for short trips; confirm fare/app estimate.'),
('Hyderabad','Taxi / Cab','App-based taxi / cab','₹120–₹800+','Citywide','Generally available','Convenient for point-to-point travel and airport transfers.'),
('Hyderabad','Train','MMTS suburban rail','₹5–₹50+','Selected suburban corridors','Schedule dependent','Useful on operating MMTS routes.'),

('Jaipur','Metro','Jaipur Metro','₹10–₹50+','Operational metro corridor','Service hours vary','Useful for selected city corridors.'),
('Jaipur','Public bus','JCTSL city bus','₹10–₹50+','Citywide','Route dependent','Budget public transport for major city routes.'),
('Jaipur','Auto-rickshaw','Local auto-rickshaw','₹50–₹300+','Citywide','Generally available','Useful for short city journeys; confirm fare before travel.'),
('Jaipur','Taxi / Cab','App-based taxi / cab','₹120–₹800+','Citywide','Generally available','Convenient for sightseeing and transfers.'),
('Jaipur','Bike / Scooter rental','Two-wheeler rental','₹300–₹800/day','Tourist areas','Availability varies','Useful for independent local sightseeing where permitted.'),

('Manali','Public bus','HRTC / local buses','₹20–₹200+','Manali and nearby routes','Route dependent','Budget option for nearby towns and selected local routes.'),
('Manali','Taxi / Cab','Local taxi','₹300–₹2,000+','Manali and sightseeing routes','Generally available','Common option for multi-stop mountain sightseeing.'),
('Manali','Bike / Scooter rental','Bike rental','₹500–₹1,500/day','Manali','Availability/weather dependent','Confirm licence, road conditions and local restrictions.'),
('Manali','Auto-rickshaw','Local auto-rickshaw','₹50–₹300+','Manali town','Availability varies','Useful for short local journeys.'),
('Manali','Bus','Volvo/intercity bus services','₹500–₹2,000+','Manali bus stand','Schedule dependent','Useful for longer intercity transfers.'),

('Mumbai','Metro','Mumbai Metro','₹10–₹80+','Operational metro corridors','Service hours vary','Fast urban travel on operating metro lines.'),
('Mumbai','Local train','Mumbai Suburban Railway','₹5–₹100+','Major railway stations','Schedule dependent','One of the main ways to travel across the city.'),
('Mumbai','Public bus','BEST buses','₹10–₹100+','Citywide','Route dependent','Extensive bus network for local travel.'),
('Mumbai','Auto-rickshaw','Local auto-rickshaw','₹30–₹300+','Suburban areas','Generally available','Useful for short trips; availability varies by area.'),
('Mumbai','Taxi / Cab','App-based taxi / cab','₹100–₹1,000+','Citywide','Generally available','Useful for point-to-point travel and airport transfers.'),

('Munnar','Public bus','KSRTC / local buses','₹20–₹200+','Munnar and nearby routes','Route dependent','Budget travel for connecting nearby towns.'),
('Munnar','Taxi / Cab','Local taxi','₹500–₹2,500+','Munnar and sightseeing routes','Generally available','Useful for multi-stop hill sightseeing.'),
('Munnar','Auto-rickshaw','Local auto-rickshaw','₹50–₹300+','Munnar town','Availability varies','Useful for short local trips.'),
('Munnar','Bike / Scooter rental','Two-wheeler rental','₹400–₹900/day','Munnar','Availability/weather dependent','Confirm licence and hill-road conditions before renting.'),
('Munnar','Bus','Intercity bus service','₹300–₹1,200+','Munnar bus stand','Schedule dependent','Useful for longer transfers to nearby cities.'),

('Mysuru','Public bus','KSRTC / city buses','₹10–₹60+','Citywide','Route dependent','Affordable way to reach major city areas.'),
('Mysuru','Auto-rickshaw','Local auto-rickshaw','₹40–₹300+','Citywide','Generally available','Useful for short local journeys.'),
('Mysuru','Taxi / Cab','App/local taxi','₹120–₹700+','Citywide','Generally available','Convenient for sightseeing and station transfers.'),
('Mysuru','Train','Mysuru railway services','₹50–₹1,000+','Mysuru Junction','Schedule dependent','Useful for regional and intercity connectivity.'),
('Mysuru','Bike / Scooter rental','Two-wheeler rental','₹300–₹700/day','Tourist areas','Availability varies','Useful for local sightseeing where permitted.'),

('New Delhi','Metro','Delhi Metro','₹10–₹100+','Delhi NCR metro network','Service hours vary','One of the fastest ways to cross major city areas.'),
('New Delhi','Public bus','DTC / cluster buses','₹10–₹50+','Delhi citywide','Route dependent','Budget public transport across many routes.'),
('New Delhi','Auto-rickshaw','Auto-rickshaw','₹40–₹400+','Citywide','Generally available','Useful for short and medium city trips.'),
('New Delhi','Taxi / Cab','App-based taxi / cab','₹120–₹1,000+','Citywide','Generally available','Convenient for point-to-point travel.'),
('New Delhi','Train','Indian Railways / local rail','₹50–₹2,000+','Major railway stations','Schedule dependent','Useful for regional and intercity journeys.'),

('Ooty','Public bus','TNSTC / local buses','₹10–₹150+','Ooty and nearby routes','Route dependent','Budget option for local and nearby travel.'),
('Ooty','Train','Nilgiri Mountain Railway','₹200–₹1,500+','Ooty railway station','Schedule dependent','Heritage mountain railway experience.'),
('Ooty','Taxi / Cab','Local taxi','₹300–₹2,000+','Ooty and sightseeing routes','Generally available','Useful for multi-stop sightseeing in hill areas.'),
('Ooty','Auto-rickshaw','Local auto-rickshaw','₹50–₹300+','Ooty town','Availability varies','Useful for short local trips.'),
('Ooty','Bike / Scooter rental','Two-wheeler rental','₹400–₹900/day','Ooty','Availability/weather dependent','Confirm licence and hill-road conditions before use.'),

('Puri','Public bus','OSRTC / local buses','₹10–₹100+','Puri and nearby routes','Route dependent','Affordable option for local and regional travel.'),
('Puri','Auto-rickshaw','Local auto-rickshaw','₹50–₹300+','Puri town','Generally available','Useful for short local journeys; confirm fare.'),
('Puri','Taxi / Cab','Local/app cab','₹120–₹800+','Puri and nearby areas','Generally available','Convenient for temple, beach and regional transfers.'),
('Puri','Train','Puri railway services','₹50–₹1,500+','Puri railway station','Schedule dependent','Useful for regional and intercity connectivity.'),
('Puri','E-rickshaw','Local e-rickshaw','₹20–₹150+','Puri town','Generally available','Low-cost option for short local journeys.'),

('Rishikesh','Public bus','UTC / local buses','₹20–₹150+','Rishikesh and nearby routes','Route dependent','Budget public transport for regional connections.'),
('Rishikesh','Auto-rickshaw','Local auto-rickshaw','₹50–₹300+','Rishikesh town','Generally available','Useful for short trips; confirm fare.'),
('Rishikesh','Taxi / Cab','Local/app cab','₹150–₹1,000+','Rishikesh and nearby areas','Generally available','Useful for sightseeing and transfers.'),
('Rishikesh','Train','Rishikesh railway services','₹50–₹1,000+','Rishikesh railway station','Schedule dependent','Useful for regional connectivity.'),
('Rishikesh','Bike / Scooter rental','Two-wheeler rental','₹300–₹800/day','Rishikesh','Availability varies','Useful for local sightseeing where permitted.'),

('Shillong','Public bus','Local city buses','₹10–₹80+','Shillong city','Route dependent','Budget option for common city routes.'),
('Shillong','Taxi / Cab','Shared/local taxi','₹50–₹500+','Shillong city and nearby areas','Generally available','Shared taxis are common for local and nearby travel.'),
('Shillong','Auto-rickshaw','Local auto-rickshaw','₹50–₹250+','Selected areas','Availability varies','Useful where local auto services operate.'),
('Shillong','Bike / Scooter rental','Two-wheeler rental','₹500–₹1,000/day','Shillong','Availability/weather dependent','Confirm licence and hill-road conditions.'),
('Shillong','Bus','Intercity bus service','₹300–₹1,500+','Shillong transport hubs','Schedule dependent','Useful for longer regional journeys.'),

('Srinagar','Public bus','SRTC / local buses','₹10–₹100+','Srinagar city','Route dependent','Budget option on operating city routes.'),
('Srinagar','Taxi / Cab','Local taxi','₹200–₹1,500+','Srinagar and tourist areas','Generally available','Useful for sightseeing and airport/transit transfers.'),
('Srinagar','Auto-rickshaw','Local auto-rickshaw','₹50–₹300+','Srinagar','Availability varies','Useful for short trips where available.'),
('Srinagar','Bike / Scooter rental','Two-wheeler rental','₹500–₹1,200/day','Srinagar','Availability/weather dependent','Check local permissions and road conditions.'),
('Srinagar','Shikara','Dal Lake shikara','₹500–₹1,500+','Dal Lake','Weather/time dependent','Tourist boat experience; agree fare and duration before boarding.'),

('Visakhapatnam','Public bus','APSRTC city buses','₹10–₹80+','Citywide','Route dependent','Affordable city transport for major areas.'),
('Visakhapatnam','Auto-rickshaw','Local auto-rickshaw','₹50–₹300+','Citywide','Generally available','Useful for short local journeys; confirm fare.'),
('Visakhapatnam','Taxi / Cab','App/local cab','₹120–₹800+','Citywide','Generally available','Convenient for sightseeing and airport/station transfers.'),
('Visakhapatnam','Train','Indian Railways / local rail','₹50–₹1,500+','Visakhapatnam Junction','Schedule dependent','Useful for regional and intercity connectivity.'),
('Visakhapatnam','Bike / Scooter rental','Two-wheeler rental','₹300–₹800/day','Tourist areas','Availability varies','Useful for independent local sightseeing where permitted.')
) as s(destination,type,name,fare_range,location,availability,description)
  on lower(trim(d.name)) = lower(trim(s.destination))
on conflict (destination_id, lower(name)) do nothing;

-- Verification
select d.name as destination, count(t.id) as transport_options
from public.destinations d
left join public.transport_options t on t.destination_id=d.id
group by d.id,d.name
order by d.name;
