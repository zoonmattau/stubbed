-- Function to recalculate achievements and points after event deletion
-- This removes achievements the user no longer qualifies for and adjusts points

create or replace function recalculate_achievements(p_user_id uuid)
returns void as $$
declare
  v_total_events integer;
  v_achievement record;
  v_points_to_deduct integer := 0;
begin
  -- Get current stats
  select total_events into v_total_events
  from user_stats where user_id = p_user_id;

  -- Find achievements user no longer qualifies for (count-based achievements)
  for v_achievement in
    select a.*, ua.id as user_achievement_id
    from user_achievements ua
    join achievements a on ua.achievement_id = a.id
    where ua.user_id = p_user_id
    and a.requirement_type = 'count'
    and (a.requirement_value->>'count')::integer > v_total_events
  loop
    -- Remove the achievement
    delete from user_achievements where id = v_achievement.user_achievement_id;

    -- Track points to deduct
    v_points_to_deduct := v_points_to_deduct + v_achievement.points;

    -- Add to activity feed (optional - track lost achievements)
    insert into activity_feed (user_id, activity_type, reference_id, metadata)
    values (p_user_id, 'achievement_lost', v_achievement.id,
      jsonb_build_object('achievement_name', v_achievement.name, 'points_lost', v_achievement.points));
  end loop;

  -- Deduct points if any achievements were lost
  if v_points_to_deduct > 0 then
    update user_stats
    set total_points = greatest(0, total_points - v_points_to_deduct)
    where user_id = p_user_id;
  end if;
end;
$$ language plpgsql security definer;

-- Update the trigger function to also recalculate achievements on delete
create or replace function trigger_update_stats()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    perform update_user_stats(OLD.user_id);
    -- Recalculate achievements after stats are updated
    perform recalculate_achievements(OLD.user_id);
    return OLD;
  else
    perform update_user_stats(NEW.user_id);
    return NEW;
  end if;
end;
$$ language plpgsql security definer;
