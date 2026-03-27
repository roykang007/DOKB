import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  product_id: string;
  option_id: string | null;
  quantity: number;
  product?: any;
  option?: any;
}

interface CartContextType {
  cart: CartItem[];
  cartItems: CartItem[]; // Alias for compatibility
  addToCart: (productId: string, optionId: string | null, quantity: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  cartCount: number;
  totalAmount: number;
  totalAmountUsd: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize session ID for guest users
  useEffect(() => {
    let sid = localStorage.getItem('dokb_session_id');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('dokb_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  // Listen for auth changes and handle migration
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUserId = session?.user?.id || null;
      
      // Migration logic: guest -> logged in
      if (newUserId && !userId) {
        const localCart = JSON.parse(localStorage.getItem('dokb_cart') || '[]');
        if (localCart.length > 0) {
          try {
            for (const item of localCart) {
              // Check if item already exists in Supabase
              let query = supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('user_id', newUserId)
                .eq('product_id', item.product_id);
              
              if (item.option_id) {
                query = query.eq('option_id', item.option_id);
              } else {
                query = query.is('option_id', null);
              }

              const { data: existing } = await query.maybeSingle();

              if (existing) {
                await supabase
                  .from('cart_items')
                  .update({ quantity: existing.quantity + item.quantity })
                  .eq('id', existing.id);
              } else {
                await supabase
                  .from('cart_items')
                  .insert([{ 
                    user_id: newUserId, 
                    product_id: item.product_id, 
                    option_id: item.option_id, 
                    quantity: item.quantity 
                  }]);
              }
            }
            localStorage.removeItem('dokb_cart');
          } catch (error) {
            console.error('Error migrating cart:', error);
          }
        }
      }
      
      setUserId(newUserId);
    });
    return () => subscription.unsubscribe();
  }, [userId]);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      if (userId) {
        const { data, error } = await supabase
          .from('cart_items')
          .select(`
            *,
            product:products(*),
            option:product_options(*)
          `)
          .eq('user_id', userId);
        
        if (!error && data) {
          setCart(data);
        }
      } else if (sessionId) {
        const localCart = JSON.parse(localStorage.getItem('dokb_cart') || '[]');
        setCart(localCart);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, sessionId]);

  // Real-time subscription for cart_items
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`cart_user_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchCart();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchCart]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId: string, optionId: string | null, quantity: number) => {
    // Optimistic UI for guest
    if (!userId) {
      const localCart = JSON.parse(localStorage.getItem('dokb_cart') || '[]');
      const index = localCart.findIndex((item: any) => item.product_id === productId && item.option_id === optionId);
      
      if (index > -1) {
        localCart[index].quantity += quantity;
      } else {
        const { data: product } = await supabase.from('products').select('*').eq('id', productId).single();
        const { data: option } = optionId ? await supabase.from('product_options').select('*').eq('id', optionId).single() : { data: null };
        
        localCart.push({
          id: crypto.randomUUID(),
          product_id: productId,
          option_id: optionId,
          quantity,
          product,
          option
        });
      }
      localStorage.setItem('dokb_cart', JSON.stringify(localCart));
      setCart([...localCart]);
      setLoading(false);
      toast.success('장바구니에 담겼습니다 ✓');
      return;
    }

    setLoading(true);
    // Optimistic UI for logged-in user
    const existingItem = cart.find(item => item.product_id === productId && item.option_id === optionId);
    if (existingItem) {
      const updatedCart = cart.map(item => 
        item.id === existingItem.id ? { ...item, quantity: item.quantity + quantity } : item
      );
      setCart(updatedCart);
    }

    try {
      let query = supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('product_id', productId);
      
      if (optionId) {
        query = query.eq('option_id', optionId);
      } else {
        query = query.is('option_id', null);
      }

      const { data: existing, error: existingError } = await query.maybeSingle();

      if (existingError) {
        console.error('Error checking existing cart item:', existingError);
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert([{ user_id: userId, product_id: productId, option_id: optionId, quantity }]);
        if (insertError) throw insertError;
      }
      await fetchCart();
      toast.success('장바구니에 담겼습니다 ✓');
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      if (error.code === '42501') {
        toast.error('데이터베이스 권한 오류(RLS)가 발생했습니다. 관리자 설정이 필요합니다.');
      } else {
        toast.error('장바구니 담기에 실패했습니다.');
      }
      fetchCart(); // Rollback
      throw error; // Re-throw to prevent navigation in handleBuyNow
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (id: string) => {
    // Optimistic UI
    const previousCart = [...cart];
    setCart(cart.filter(item => item.id !== id));

    if (userId) {
      const { error } = await supabase.from('cart_items').delete().eq('id', id);
      if (error) {
        setCart(previousCart);
        toast.error('삭제에 실패했습니다.');
      }
    } else {
      const localCart = previousCart.filter(item => item.id !== id);
      localStorage.setItem('dokb_cart', JSON.stringify(localCart));
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return;
    
    // Optimistic UI
    const previousCart = [...cart];
    setCart(cart.map(item => item.id === id ? { ...item, quantity } : item));

    if (userId) {
      const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', id);
      if (error) {
        setCart(previousCart);
        toast.error('수량 변경에 실패했습니다.');
      }
    } else {
      const localCart = previousCart.map(item => item.id === id ? { ...item, quantity } : item);
      localStorage.setItem('dokb_cart', JSON.stringify(localCart));
    }
  };

  const clearCart = () => {
    if (userId) {
      supabase.from('cart_items').delete().eq('user_id', userId).then(() => fetchCart());
    } else {
      localStorage.removeItem('dokb_cart');
      setCart([]);
    }
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  
  const totalAmount = cart.reduce((acc, item) => {
    const basePrice = item.product?.price || 0;
    const optionPrice = item.option?.additional_price || 0;
    return acc + (basePrice + optionPrice) * item.quantity;
  }, 0);

  const totalAmountUsd = cart.reduce((acc, item) => {
    const basePrice = item.product?.price_usd || 0;
    const optionPrice = (item.option?.additional_price || 0) / 1300;
    return acc + (basePrice + optionPrice) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      cartItems: cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      cartCount,
      totalAmount,
      totalAmountUsd,
      loading
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
