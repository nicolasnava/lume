BEGIN;

-- The referral recalculation is only invoked by its database trigger. It must
-- not be callable directly through the PostgREST RPC surface.
ALTER FUNCTION public.fn_recalcular_desconto_indicacao(uuid) SET search_path = '';
ALTER FUNCTION public.fn_trg_atualizar_desconto_indicacao() SET search_path = '';
REVOKE ALL ON FUNCTION public.fn_recalcular_desconto_indicacao(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.fn_trg_atualizar_desconto_indicacao()
  FROM PUBLIC, anon, authenticated, service_role;

-- This lookup is called server-side with the service role by the studio invite
-- action. Restrict its access so clients cannot enumerate professional emails.
ALTER FUNCTION public.buscar_profissional_por_email(text) SET search_path = '';
REVOKE ALL ON FUNCTION public.buscar_profissional_por_email(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_profissional_por_email(text)
  TO service_role;

-- Fail the migration rather than silently leaving either exposed RPC public.
DO $$
BEGIN
  IF has_function_privilege('anon', 'public.fn_recalcular_desconto_indicacao(uuid)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.fn_recalcular_desconto_indicacao(uuid)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.buscar_profissional_por_email(text)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.buscar_profissional_por_email(text)', 'EXECUTE')
  THEN
    RAISE EXCEPTION 'Sensitive RPC privileges remain available to client roles';
  END IF;

  IF NOT has_function_privilege('service_role', 'public.buscar_profissional_por_email(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role must retain access to the studio invite lookup';
  END IF;
END;
$$;

COMMIT;
