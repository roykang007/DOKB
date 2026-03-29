export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name_ko: string
          name_en: string
          description_ko: string | null
          description_en: string | null
          price: number
          price_usd: number
          stock_quantity: number
          category: 'beauty' | 'food' | 'lifestyle' | 'dokb_brand'
          brand: string | null
          tags: string[] | null
          images: string[] | null
          thumbnail: string | null
          is_active: boolean
          is_featured: boolean
          weight_g: number | null
          original_price: number | null
          discount_rate: number | null
          shipping_fee: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_ko: string
          name_en: string
          description_ko?: string | null
          description_en?: string | null
          price: number
          price_usd: number
          stock_quantity?: number
          category: 'beauty' | 'food' | 'lifestyle' | 'dokb_brand'
          brand?: string | null
          tags?: string[] | null
          images?: string[] | null
          thumbnail?: string | null
          is_active?: boolean
          is_featured?: boolean
          weight_g?: number | null
          original_price?: number | null
          discount_rate?: number | null
          shipping_fee?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name_ko?: string
          name_en?: string
          description_ko?: string | null
          description_en?: string | null
          price?: number
          price_usd?: number
          stock_quantity?: number
          category?: 'beauty' | 'food' | 'lifestyle' | 'dokb_brand'
          brand?: string | null
          tags?: string[] | null
          images?: string[] | null
          thumbnail?: string | null
          is_active?: boolean
          is_featured?: boolean
          weight_g?: number | null
          original_price?: number | null
          discount_rate?: number | null
          shipping_fee?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      product_options: {
        Row: {
          id: string
          product_id: string
          option_name: string
          option_value: string
          additional_price: number
          stock_quantity: number
        }
        Insert: {
          id?: string
          product_id: string
          option_name: string
          option_value: string
          additional_price?: number
          stock_quantity?: number
        }
        Update: {
          id?: string
          product_id?: string
          option_name?: string
          option_value?: string
          additional_price?: number
          stock_quantity?: number
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          product_id: string
          option_id: string | null
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          product_id: string
          option_id?: string | null
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          product_id?: string
          option_id?: string | null
          quantity?: number
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          guest_email: string | null
          status: 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
          total_amount: number
          total_amount_usd: number
          currency: 'KRW' | 'USD'
          shipping_name: string
          shipping_phone: string
          shipping_address: string
          shipping_zipcode: string
          shipping_country: string
          shipping_fee: number
          payment_method: string
          payment_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          user_id?: string | null
          guest_email?: string | null
          status?: 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
          total_amount: number
          total_amount_usd: number
          currency: 'KRW' | 'USD'
          shipping_name: string
          shipping_phone: string
          shipping_address: string
          shipping_zipcode: string
          shipping_country: string
          shipping_fee: number
          payment_method: string
          payment_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string | null
          guest_email?: string | null
          status?: 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
          total_amount?: number
          total_amount_usd?: number
          currency?: 'KRW' | 'USD'
          shipping_name?: string
          shipping_phone?: string
          shipping_address?: string
          shipping_zipcode?: string
          shipping_country?: string
          shipping_fee?: number
          payment_method?: string
          payment_key?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          option_id: string | null
          product_name_ko: string
          product_name_en: string
          unit_price: number
          quantity: number
          subtotal: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          option_id?: string | null
          product_name_ko: string
          product_name_en: string
          unit_price: number
          quantity: number
          subtotal: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          option_id?: string | null
          product_name_ko?: string
          product_name_en?: string
          unit_price?: number
          quantity?: number
          subtotal?: number
        }
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          order_id: string
          rating: number
          content: string | null
          images: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          order_id: string
          rating: number
          content?: string | null
          images?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          order_id?: string
          rating?: number
          content?: string | null
          images?: string[] | null
          created_at?: string
        }
      }
    }
  }
}
