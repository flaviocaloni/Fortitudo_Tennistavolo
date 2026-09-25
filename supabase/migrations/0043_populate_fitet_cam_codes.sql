-- Migration 0043: Populate FITET CAM codes for known teams
-- Maps D3 MI F (BabyTeam) to CAM=446 and D3 MI D (NewTeam) to CAM=444

UPDATE public.championship_teams
SET fitet_cam_code = CASE
  WHEN name ILIKE '%BabyTeam%' AND series = 'D3' AND group_code = 'MI F' THEN 446
  WHEN name ILIKE '%NewTeam%' AND series = 'D3' AND group_code = 'MI D' THEN 444
  WHEN name ILIKE '%YoungTeam%' AND series = 'D2' AND group_code = 'J' THEN 431
  WHEN name ILIKE '%MasterTeam%' AND series = 'D2' AND group_code = 'D' THEN 425
  WHEN name ILIKE '%DreamTeam%' AND series = 'D1' AND group_code = 'A' THEN 414
  ELSE fitet_cam_code
END
WHERE series IN ('D1', 'D2', 'D3');
