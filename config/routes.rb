Rails.application.routes.draw do
  root 'sessions#new'

  get 'about',   to: 'static_pages#about'
  get 'signup',  to: 'users#new'

  post   '/login',   to: 'sessions#new'
  delete '/logout',  to: 'sessions#destroy'

  resources :users
  resources :account_activations, only: [:edit]
  resources :password_resets,     only: [:new, :create, :edit, :update]
  resources :email_resets,        only: [:new, :create, :edit, :update]

  get  'home',                     to: 'users#home'
  scope '/settings' do
    get  'profile',                to: 'users#profile'
    get  'account',                to: 'users#account' 
    get  'confirm_delete_account', to: 'users#confirm_delete_account'
    post 'change_password',        to: 'users#change_password'
    post 'delete_account',         to: 'users#delete_account'
    get  'rhisomas',               to: 'territories#list'
    get  'edit_rhisoma/:id',       to: 'territories#edit'
  end

  resources :territories
  patch '/nodes/position', to: 'nodes#bulk_update_pos'
  resources :nodes
  resources :edges
  post '/territories/:id/clone', to: 'territories#clone'

  resources :styling_groups

  get '/.well-known/acme-challenge/:id' => 'sessions#temp'
  get '/fake_logout' => 'sessions#fake_destroy'
end
