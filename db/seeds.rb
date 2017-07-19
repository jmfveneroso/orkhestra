admin = User.create!(email: "user@example.com",
             password:              "foobar",
             password_confirmation: "foobar",
             admin: true,
             activated: true,
             activated_at: Time.zone.now)

99.times do |n|
  name  = Faker::Name.name
  email = "example-#{n+1}@railstutorial.org"
  password = "password"
  User.create!(email: email,
               password:              password,
               password_confirmation: password,
               activated: true,
               activated_at: Time.zone.now)
end

territory = Territory.create(name: "Example") do |t|
  t.user = admin
end

json = ActiveSupport::JSON.decode(File.read('db/graph_seeds.json'))
json['groups'].each do |a|
  sg = StylingGroup.create(a) do |g|
    g.user = admin
  end
  sg.save
end

json['nodes'].each do |a|
  n = a['type'].constantize.new(a)
  n.territory = territory
  n.save
end

json['links'].each do |a|
  e = Edge.create(a)
  e.save
end

connection = ActiveRecord::Base.connection()
connection.execute("SELECT setval('nodes_id_seq', COALESCE((SELECT MAX(id)+1 FROM nodes), 1), false);")
connection.execute("SELECT setval('edges_id_seq', COALESCE((SELECT MAX(id)+1 FROM edges), 1), false);")
connection.execute("SELECT setval('styling_groups_id_seq', COALESCE((SELECT MAX(id)+1 FROM styling_groups), 1), false);")
