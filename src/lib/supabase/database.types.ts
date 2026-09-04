export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profissionais: {
        Row: {
          id: string
          nome: string
          bio: string | null
          foto_url: string | null
          foto_capa_url: string | null
          localizacao: string | null
          whatsapp: string | null
          instagram: string | null
          categoria: string[]
          slug: string
          cor_primaria: string
          cor_secundaria: string
          google_calendar_token: string | null
          formas_pagamento_aceitas?: string[]
          slug_alterado_em?: string | null
          tagline?: string | null
          modalidade_atendimento?: string[] | string | null
          janela_agendamento_dias?: number
          status_conta?: 'trial' | 'ativa' | 'atrasada' | 'suspensa' | 'cortesia' | 'cancelada'
          notas_internas?: string | null
          plano_tipo?: 'mensal' | 'anual' | 'cortesia'
          valor_mensalidade?: number
          trial_ends_at?: string | null
          proximo_vencimento?: string | null
          deletado_em?: string | null
          estudio_id?: string | null
          ativo_no_estudio?: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          bio?: string | null
          foto_url?: string | null
          foto_capa_url?: string | null
          localizacao?: string | null
          whatsapp?: string | null
          instagram?: string | null
          categoria: string[]
          slug: string
          cor_primaria?: string
          cor_secundaria?: string
          google_calendar_token?: string | null
          formas_pagamento_aceitas?: string[]
          slug_alterado_em?: string | null
          tagline?: string | null
          modalidade_atendimento?: string[] | string | null
          janela_agendamento_dias?: number
          status_conta?: 'trial' | 'ativa' | 'atrasada' | 'suspensa' | 'cortesia' | 'cancelada'
          notas_internas?: string | null
          plano_tipo?: 'mensal' | 'anual' | 'cortesia'
          valor_mensalidade?: number
          trial_ends_at?: string | null
          proximo_vencimento?: string | null
          deletado_em?: string | null
          estudio_id?: string | null
          ativo_no_estudio?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          bio?: string | null
          foto_url?: string | null
          foto_capa_url?: string | null
          localizacao?: string | null
          whatsapp?: string | null
          instagram?: string | null
          categoria?: string[]
          slug?: string
          cor_primaria?: string
          cor_secundaria?: string
          google_calendar_token?: string | null
          formas_pagamento_aceitas?: string[]
          slug_alterado_em?: string | null
          tagline?: string | null
          modalidade_atendimento?: string[] | string | null
          janela_agendamento_dias?: number
          status_conta?: 'trial' | 'ativa' | 'atrasada' | 'suspensa' | 'cortesia' | 'cancelada'
          notas_internas?: string | null
          plano_tipo?: 'mensal' | 'anual' | 'cortesia'
          valor_mensalidade?: number
          trial_ends_at?: string | null
          proximo_vencimento?: string | null
          estudio_id?: string | null
          ativo_no_estudio?: boolean
          created_at?: string
        }
        Relationships: []
      }
      bloqueios_disponibilidade: {
        Row: {
          id: string
          profissional_id: string
          data: string
          data_fim: string | null
          hora_inicio: string | null
          hora_fim: string | null
          motivo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profissional_id: string
          data: string
          data_fim?: string | null
          hora_inicio?: string | null
          hora_fim?: string | null
          motivo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profissional_id?: string
          data?: string
          data_fim?: string | null
          hora_inicio?: string | null
          hora_fim?: string | null
          motivo?: string | null
          created_at?: string
        }
        Relationships: []
      }
      servicos: {
        Row: {
          id: string
          profissional_id: string
          nome: string
          descricao: string | null
          duracao_minutos: number
          preco: number
          foto_url: string | null
          intervalo_manutencao_dias: number | null
          ativo?: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          profissional_id: string
          nome: string
          descricao?: string | null
          duracao_minutos: number
          preco: number
          foto_url?: string | null
          intervalo_manutencao_dias?: number | null
          ativo?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          profissional_id?: string
          nome?: string
          descricao?: string | null
          duracao_minutos?: number
          preco?: number
          foto_url?: string | null
          intervalo_manutencao_dias?: number | null
          ativo?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      disponibilidade: {
        Row: {
          id: string
          profissional_id: string
          dia_semana: number
          hora_inicio: string
          hora_fim: string
          created_at: string
        }
        Insert: {
          id?: string
          profissional_id: string
          dia_semana: number
          hora_inicio: string
          hora_fim: string
          created_at?: string
        }
        Update: {
          id?: string
          profissional_id?: string
          dia_semana?: number
          hora_inicio?: string
          hora_fim?: string
          created_at?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          id: string
          profissional_id: string
          nome: string
          telefone: string
          created_at: string
        }
        Insert: {
          id?: string
          profissional_id: string
          nome: string
          telefone: string
          created_at?: string
        }
        Update: {
          id?: string
          profissional_id?: string
          nome?: string
          telefone?: string
          created_at?: string
        }
        Relationships: []
      }
      agendamentos: {
        Row: {
          id: string
          profissional_id: string
          cliente_id: string
          servico_id: string | null
          data_hora_inicio: string
          data_hora_fim: string
          status: 'confirmado' | 'cancelado' | 'concluido' | 'no_show'
          google_event_id: string | null
          lembrete_confirmacao_enviado: boolean
          lembrete_manutencao_enviado: boolean
          forma_pagamento: 'dinheiro' | 'pix' | 'cartao' | 'cartao_credito' | 'cartao_debito' | 'outro' | null
          valor_cobrado: number | null
          pago: boolean
          observacao_pagamento: string | null
          forma_pagamento_preferida?: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profissional_id: string
          cliente_id: string
          servico_id?: string | null
          data_hora_inicio: string
          data_hora_fim: string
          status?: 'confirmado' | 'cancelado' | 'concluido' | 'no_show'
          google_event_id?: string | null
          lembrete_confirmacao_enviado?: boolean
          lembrete_manutencao_enviado?: boolean
          forma_pagamento?: 'dinheiro' | 'pix' | 'cartao' | 'cartao_credito' | 'cartao_debito' | 'outro' | null
          valor_cobrado?: number | null
          pago?: boolean
          observacao_pagamento?: string | null
          forma_pagamento_preferida?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profissional_id?: string
          cliente_id?: string
          servico_id?: string | null
          data_hora_inicio?: string
          data_hora_fim?: string
          status?: 'confirmado' | 'cancelado' | 'concluido' | 'no_show'
          google_event_id?: string | null
          lembrete_confirmacao_enviado?: boolean
          lembrete_manutencao_enviado?: boolean
          forma_pagamento?: 'dinheiro' | 'pix' | 'cartao' | 'cartao_credito' | 'cartao_debito' | 'outro' | null
          valor_cobrado?: number | null
          pago?: boolean
          observacao_pagamento?: string | null
          forma_pagamento_preferida?: string | null
          created_at?: string
        }
        Relationships: []
      }
      avaliacoes: {
        Row: {
          id: string
          agendamento_id: string
          profissional_id: string
          nota: number
          comentario: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agendamento_id: string
          profissional_id: string
          nota: number
          comentario?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          agendamento_id?: string
          profissional_id?: string
          nota?: number
          comentario?: string | null
          created_at?: string
        }
        Relationships: []
      }
      agendamento_servicos: {
        Row: {
          id: string
          agendamento_id: string
          servico_id: string | null
          preco_no_momento: number
          duracao_no_momento_minutos: number
          created_at: string
        }
        Insert: {
          id?: string
          agendamento_id: string
          servico_id?: string | null
          preco_no_momento: number
          duracao_no_momento_minutos: number
          created_at?: string
        }
        Update: {
          id?: string
          agendamento_id?: string
          servico_id?: string | null
          preco_no_momento?: number
          duracao_no_momento_minutos?: number
          created_at?: string
        }
        Relationships: []
      }
      slugs_antigos: {
        Row: {
          id: string
          profissional_id: string
          slug_antigo: string
          created_at: string
        }
        Insert: {
          id?: string
          profissional_id: string
          slug_antigo: string
          created_at?: string
        }
        Update: {
          id?: string
          profissional_id?: string
          slug_antigo?: string
          created_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          id: string
          email: string
          nome: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          nome: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          nome?: string
          created_at?: string
        }
        Relationships: []
      }
      admin_otp_codes: {
        Row: {
          id: string
          admin_id: string
          codigo_hash: string
          token_link_hash: string | null
          expira_em: string
          usado: boolean
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          codigo_hash: string
          token_link_hash?: string | null
          expira_em: string
          usado?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          codigo_hash?: string
          token_link_hash?: string | null
          expira_em?: string
          usado?: boolean
          created_at?: string
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          id: string
          admin_id: string
          acao: string
          profissional_id: string | null
          detalhes: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          acao: string
          profissional_id?: string | null
          detalhes?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          acao?: string
          profissional_id?: string | null
          detalhes?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      saas_planos: {
        Row: {
          id: string
          nome: string
          slug: string
          preco: number
          intervalo: 'mensal' | 'anual'
          descricao: string | null
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          slug: string
          preco: number
          intervalo: 'mensal' | 'anual'
          descricao?: string | null
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
          preco?: number
          intervalo?: 'mensal' | 'anual'
          descricao?: string | null
          ativo?: boolean
          created_at?: string
        }
        Relationships: []
      }
      saas_faturas: {
        Row: {
          id: string
          profissional_id: string
          plano_slug: string
          valor: number
          status: 'pago' | 'pendente' | 'vencido' | 'cancelado' | 'reembolsado'
          forma_pagamento: 'pix' | 'cartao_credito' | 'boleto' | 'manual' | 'cortesia' | null
          data_vencimento: string
          data_pagamento: string | null
          link_pagamento: string | null
          codigo_pix: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profissional_id: string
          plano_slug?: string
          valor: number
          status?: 'pago' | 'pendente' | 'vencido' | 'cancelado' | 'reembolsado'
          forma_pagamento?: 'pix' | 'cartao_credito' | 'boleto' | 'manual' | 'cortesia' | null
          data_vencimento: string
          data_pagamento?: string | null
          link_pagamento?: string | null
          codigo_pix?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profissional_id?: string
          plano_slug?: string
          valor?: number
          status?: 'pago' | 'pendente' | 'vencido' | 'cancelado' | 'reembolsado'
          forma_pagamento?: 'pix' | 'cartao_credito' | 'boleto' | 'manual' | 'cortesia' | null
          data_vencimento?: string
          data_pagamento?: string | null
          link_pagamento?: string | null
          codigo_pix?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saas_faturas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          }
        ]
      }
      saas_cupons: {
        Row: {
          id: string
          codigo: string
          desconto_pct: number | null
          desconto_valor: number | null
          dias_trial_extra: number
          valido_ate: string | null
          usado_count: number
          limite_usos: number | null
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          codigo: string
          desconto_pct?: number | null
          desconto_valor?: number | null
          dias_trial_extra?: number
          valido_ate?: string | null
          usado_count?: number
          limite_usos?: number | null
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          codigo?: string
          desconto_pct?: number | null
          desconto_valor?: number | null
          dias_trial_extra?: number
          valido_ate?: string | null
          usado_count?: number
          limite_usos?: number | null
          ativo?: boolean
          created_at?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          id: string
          profissional_id: string
          tipo: 'sugestao' | 'bug' | 'elogio' | 'outro'
          mensagem: string
          status: 'novo' | 'em_analise' | 'resolvido'
          created_at: string
        }
        Insert: {
          id?: string
          profissional_id: string
          tipo: 'sugestao' | 'bug' | 'elogio' | 'outro'
          mensagem: string
          status?: 'novo' | 'em_analise' | 'resolvido'
          created_at?: string
        }
        Update: {
          id?: string
          profissional_id?: string
          tipo?: 'sugestao' | 'bug' | 'elogio' | 'outro'
          mensagem?: string
          status?: 'novo' | 'em_analise' | 'resolvido'
          created_at?: string
        }
        Relationships: []
      }
      login_logs: {
        Row: {
          id: string
          profissional_id: string
          created_at: string
        }
        Insert: {
          id?: string
          profissional_id: string
          created_at?: string
        }
        Update: {
          id?: string
          profissional_id?: string
          created_at?: string
        }
        Relationships: []
      }
      avisos_plataforma: {
        Row: {
          id: string
          mensagem: string
          ativo: boolean
          tipo: 'info' | 'alerta' | 'manutencao'
          created_at: string
        }
        Insert: {
          id?: string
          mensagem: string
          ativo?: boolean
          tipo?: 'info' | 'alerta' | 'manutencao'
          created_at?: string
        }
        Update: {
          id?: string
          mensagem?: string
          ativo?: boolean
          tipo?: 'info' | 'alerta' | 'manutencao'
          created_at?: string
        }
        Relationships: []
      }
      nps_respostas: {
        Row: {
          id: string
          profissional_id: string
          nota: number
          comentario: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profissional_id: string
          nota: number
          comentario?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profissional_id?: string
          nota?: number
          comentario?: string | null
          created_at?: string
        }
        Relationships: []
      }
      novidades: {
        Row: {
          id: string
          titulo: string
          descricao: string
          created_at: string
        }
        Insert: {
          id?: string
          titulo: string
          descricao: string
          created_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          descricao?: string
          created_at?: string
        }
        Relationships: []
      }
      rate_limit_log: {
        Row: {
          id: string
          chave: string
          acao: string
          created_at: string
        }
        Insert: {
          id?: string
          chave: string
          acao: string
          created_at?: string
        }
        Update: {
          id?: string
          chave?: string
          acao?: string
          created_at?: string
        }
        Relationships: []
      }
      estudios: {
        Row: {
          id: string
          nome: string
          slug: string
          bio: string | null
          foto_capa_url: string | null
          cor_primaria: string
          cor_secundaria: string
          criado_por: string
          round_robin_ultimo_membro_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          slug: string
          bio?: string | null
          foto_capa_url?: string | null
          cor_primaria?: string
          cor_secundaria?: string
          criado_por: string
          round_robin_ultimo_membro_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
          bio?: string | null
          foto_capa_url?: string | null
          cor_primaria?: string
          cor_secundaria?: string
          criado_por?: string
          round_robin_ultimo_membro_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      estudio_convites: {
        Row: {
          id: string
          estudio_id: string
          tipo: 'link' | 'email'
          codigo: string | null
          email_convidado: string | null
          status: 'pendente' | 'aceito' | 'expirado' | 'cancelado'
          expira_em: string
          created_at: string
        }
        Insert: {
          id?: string
          estudio_id: string
          tipo: 'link' | 'email'
          codigo?: string | null
          email_convidado?: string | null
          status?: 'pendente' | 'aceito' | 'expirado' | 'cancelado'
          expira_em?: string
          created_at?: string
        }
        Update: {
          id?: string
          estudio_id?: string
          tipo?: 'link' | 'email'
          codigo?: string | null
          email_convidado?: string | null
          status?: 'pendente' | 'aceito' | 'expirado' | 'cancelado'
          expira_em?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      profissionais_publico: {
        Row: {
          id: string
          nome: string
          bio: string | null
          foto_url: string | null
          foto_capa_url: string | null
          categoria: string[]
          slug: string
          cor_primaria: string
          cor_secundaria: string
          localizacao: string | null
          whatsapp: string | null
          instagram: string | null
          tagline: string | null
          modalidade_atendimento: string[] | string | null
          janela_agendamento_dias: number
          formas_pagamento_aceitas: string[] | null
          estudio_id: string | null
          ativo_no_estudio: boolean
          created_at: string
        }
        Relationships: []
      }
    }
    Functions: {
      buscar_profissional_por_email: {
        Args: {
          search_email: string
        }
        Returns: {
          id: string
          nome: string
          foto_url: string | null
          slug: string
          email: string
          estudio_id: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
