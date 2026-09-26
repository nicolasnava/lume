-- Serializa as tentativas por chave para que requisições concorrentes não
-- ultrapassem o limite entre a consulta e a gravação.
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_chave text,
  p_acao text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS TABLE (
  allowed boolean,
  current_count integer,
  retry_after_seconds integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz;
  v_count integer;
  v_oldest timestamptz;
BEGIN
  IF p_chave IS NULL OR btrim(p_chave) = ''
    OR p_acao IS NULL OR btrim(p_acao) = ''
    OR p_limit IS NULL OR p_window_seconds IS NULL
    OR p_limit < 1 OR p_window_seconds < 1
  THEN
    RAISE EXCEPTION 'Parâmetros inválidos para rate limit';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_acao || ':' || p_chave, 0));
  v_now := clock_timestamp();

  SELECT count(*)::integer, min(created_at)
    INTO v_count, v_oldest
    FROM public.rate_limit_log
   WHERE chave = p_chave
     AND acao = p_acao
     AND created_at > v_now - make_interval(secs => p_window_seconds);

  INSERT INTO public.rate_limit_log (chave, acao, created_at)
  VALUES (p_chave, p_acao, v_now);

  v_count := v_count + 1;

  RETURN QUERY
  SELECT
    v_count <= p_limit,
    v_count,
    CASE
      WHEN v_oldest IS NULL THEN p_window_seconds
      ELSE greatest(
        1,
        ceil(extract(epoch FROM (v_oldest + make_interval(secs => p_window_seconds) - v_now)))::integer
      )
    END;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, text, integer, integer) TO service_role;
