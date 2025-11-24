-- Update blog posts to Paris American
UPDATE posts
SET post_type_id = (SELECT pt.id FROM post_types pt WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2' AND pt.slug = 'blogs' LIMIT 1)
WHERE id IN (
  't8Q-ZKFanC3t06KABtM41', 'hJUMRWtTWCT6s0WlNL4-i', 'O33NQbi-BFYp9t25pVjoL',
  'NVQBhzFme3L35OOpBJOIr', 'H20Mk7QghpkTod2LteRd9', 'te_tracjvr0ayAl4beYsC',
  'RdGX6cJKH7QPbruG4DZ62', 'piHn518vACfFg8mAnIWUk', 'pHQAa-TIJ0Ybk16oDu719',
  'qtknIcQLDF8qd78IAqrQ7', 'WqetMlba0vyhUMUL-XG-A', 'Bo8LQ-Gioy2AKnp4Q06ef',
  'tbliX6RCJuniCFjve_Zr7', 'AM2L2z2cZ7eChe6KdE04n', 'r20ih91EAepnld7sP-4T8',
  'c2bKvIUl5RHzF99yi04ix'
)
AND EXISTS (SELECT 1 FROM post_types pt WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2' AND pt.slug = 'blogs');

-- Update academic-staff posts to Paris American  
UPDATE posts
SET post_type_id = (SELECT pt.id FROM post_types pt WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2' AND pt.slug = 'academic-staff' LIMIT 1)
WHERE id IN (
  'DLr02lPqQ3BeXhzSqtmMZ', 'rgcCeWNb6yewFcjGjVbBV', 'UHVesc7LzBIbKgxP4OvPg',
  'Vkh3RiQkkl7_OJCOhqNaA', 'J3GKUoenYB4Zt3_7oodAt', 'KK2y7XA7G4ba2x6Wvw4um',
  'G5tzW0ISig0y1dw7EipwI', 'W8pbn5bfNVuaSDyQFTyBi', 'gTac1bV3UwfmKz7mbgMLt',
  'z6K8EqIjwazvyzZZx6YHB'
)
AND EXISTS (SELECT 1 FROM post_types pt WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2' AND pt.slug = 'academic-staff');

