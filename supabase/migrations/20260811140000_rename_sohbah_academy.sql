-- Rename Sohbah academy display name
update public.academies
set
  name_ar = 'مقراءة صحبة الإلكترونية',
  name_en = 'Sohbah Online Recitation'
where slug = 'sohbah';
