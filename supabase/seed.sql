-- =====================================================================
--  DATI DEMO (facoltativo) - esegui DOPO schema.sql
--  Crea una stagione, un campionato con 8 squadre, rose, calendario,
--  4 giornate gia' giocate con gol e cartellini, e 2 news.
--  Eseguilo una sola volta: poi cancella i dati demo dal pannello admin.
-- =====================================================================
do $$
declare
  s_id uuid; c_id uuid; v_id uuid; t_id uuid; m_id uuid;
  team_ids uuid[] := '{}';
  arr uuid[];
  n int := 8;
  cities text[] := array['Pieve di Soligo','Soligo','Follina','Vittorio Veneto','Conegliano','Valdobbiadene','Susegana','Refrontolo'];
  tnames text[]  := array['Pieve United','ASD Soligo','Follina Veneto','Vittorio Sport','Conegliano Azzurri','Valdobbiadene FC','Susegana 1950','Refrontolo Atletico'];
  tshort text[]  := array['PIE','SOL','FOL','VIT','CON','VAL','SUS','REF'];
  tcolors text[] := array['Verde-Bianco','Rosso-Blu','Giallo-Nero','Azzurro','Azzurro-Bianco','Verde-Oro','Bianco-Rosso','Arancio-Nero'];
  firsts text[]  := array['Marco','Luca','Andrea','Matteo','Davide','Simone','Federico','Alessandro','Nicola','Stefano','Giacomo','Riccardo','Filippo','Enrico','Paolo','Tommaso','Daniele','Michele','Lorenzo','Giovanni'];
  lasts text[]   := array['Rossi','Bianchi','Zanette','Dal Bo','Moretto','Favaro','Furlan','De Zan','Tonon','Bortolin','Callegari','Pozzobon','Sartori','Gasparini','Zago','Salvador','Menegon','Brunello','Cescon','Dalla Torre'];
  roles text[]   := array['Portiere','Portiere','Difensore','Difensore','Difensore','Difensore','Difensore','Centrocampista','Centrocampista','Centrocampista','Centrocampista','Centrocampista','Attaccante','Attaccante','Attaccante','Attaccante'];
  i int; k int; r int; m int; g int;
  h uuid; a uuid; hs int; asc_ int; is_played boolean;
begin
  insert into seasons (name, start_date, end_date, is_current)
  values ('2026/2027', date '2026-09-01', date '2027-06-30', true)
  returning id into s_id;

  insert into competitions (season_id, name, category, level, region, province)
  values (s_id, 'Prima Categoria Girone D', 'Prima Categoria', 'provinciale', 'Veneto', 'TV')
  returning id into c_id;

  for i in 1..n loop
    insert into venues (name, city, address, surface, capacity)
    values ('Stadio Comunale ' || cities[i], cities[i], 'Via dello Sport 1', 'Erba naturale', 500)
    returning id into v_id;

    insert into teams (name, short_name, city, province, region, colors, founded_year, venue_id)
    values (tnames[i], tshort[i], cities[i], 'TV', 'Veneto', tcolors[i], 1945 + i * 4, v_id)
    returning id into t_id;

    team_ids := team_ids || t_id;
    insert into competition_teams (competition_id, team_id) values (c_id, t_id);

    for k in 1..16 loop
      insert into players (first_name, last_name, birth_date, role, shirt_number, team_id, nationality)
      values (
        firsts[((i * 7 + k * 3) % 20) + 1],
        lasts[((i * 5 + k * 11) % 20) + 1],
        date '1988-01-01' + ((i * 131 + k * 379) % 5500),
        roles[k], k, t_id, 'Italia'
      );
    end loop;
  end loop;

  -- Calendario all'italiana (metodo del cerchio), solo andata
  arr := team_ids;
  for r in 1..(n - 1) loop
    for m in 1..(n / 2) loop
      h := arr[m];
      a := arr[n + 1 - m];
      if (r + m) % 2 = 1 then
        t_id := h; h := a; a := t_id;
      end if;

      is_played := r <= 4;
      hs := null; asc_ := null;
      if is_played then
        hs := floor(random() * 4)::int;
        asc_ := floor(random() * 3)::int;
      end if;

      insert into matches (competition_id, matchday, home_team_id, away_team_id, venue_id, kickoff,
                           home_score, away_score, status, referee)
      values (
        c_id, r, h, a,
        (select venue_id from teams where id = h),
        date_trunc('week', now()) + interval '6 days 15 hours' + ((r - 5) * interval '7 days'),
        hs, asc_,
        case when is_played then 'played' else 'scheduled' end,
        case when is_played then 'Sig. ' || lasts[((r * 3 + m * 7) % 20) + 1] else null end
      )
      returning id into m_id;

      if is_played then
        for g in 1..hs loop
          insert into match_events (match_id, team_id, player_id, minute, type)
          values (m_id, h,
            (select id from players where team_id = h and role <> 'Portiere' order by random() limit 1),
            1 + floor(random() * 89)::int, 'goal');
        end loop;
        for g in 1..asc_ loop
          insert into match_events (match_id, team_id, player_id, minute, type)
          values (m_id, a,
            (select id from players where team_id = a and role <> 'Portiere' order by random() limit 1),
            1 + floor(random() * 89)::int, 'goal');
        end loop;
        if random() < 0.7 then
          insert into match_events (match_id, team_id, player_id, minute, type)
          values (m_id, h, (select id from players where team_id = h order by random() limit 1),
                  1 + floor(random() * 89)::int, 'yellow');
        end if;
        if random() < 0.7 then
          insert into match_events (match_id, team_id, player_id, minute, type)
          values (m_id, a, (select id from players where team_id = a order by random() limit 1),
                  1 + floor(random() * 89)::int, 'yellow');
        end if;
        if random() < 0.1 then
          insert into match_events (match_id, team_id, player_id, minute, type)
          values (m_id, a, (select id from players where team_id = a order by random() limit 1),
                  60 + floor(random() * 30)::int, 'red');
        end if;
      end if;
    end loop;
    arr := array[arr[1], arr[n]] || arr[2:n - 1];
  end loop;

  insert into news (title, body, published) values
    ('Benvenuti nella nuova app del campionato',
     'Da oggi classifiche, calendari, marcatori e referti sono consultabili online. Gli aggiornamenti vengono inseriti dagli addetti della societa'' dopo ogni giornata.',
     true),
    ('Chiusura iscrizioni e regolamento',
     'Ricordiamo alle societa'' di verificare i dati di rosa e tesseramenti nell''area dedicata prima dell''inizio della giornata successiva.',
     true);
end $$;
