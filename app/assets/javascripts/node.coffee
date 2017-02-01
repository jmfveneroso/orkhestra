Number.prototype.clamp = (min, max) -> Math.min(Math.max(this, min), max)

class Api
  @get_graph: -> $.get '/territories',

  @show_graph: (id) -> $.get '/territories/' + id,

  @delete_node: (id) -> $.ajax(url: '/nodes/' + id, method: 'DELETE')

  @create_edge: (category, source_id, target_id) ->
    $.post '/edges/',
      'edge[category]': category
      'edge[source_id]': source_id
      'edge[target_id]': target_id

  @update_edge: (id, source_id, target_id, category) ->
    $.ajax
      url: '/edges/' + id
      method: 'PATCH',
      data: 'edge[source_id]': source_id, 'edge[target_id]': target_id, 'edge[category]': category

  @delete_edge: (id) ->
    $.ajax
      url: '/edges/' + id
      method: 'DELETE'

  @create_node: (data) ->
    $.post '/nodes', data

  @update_node: (id, data) ->
    $.ajax
      url: '/nodes/' + id
      method: 'PATCH',
      data: data

  @delete_node: (id) ->
    $.ajax
      url: '/nodes/' + id
      method: 'DELETE'

  @get_territory: (id) -> $.get '/territories/' + id

  @create_territory: (name, is_template, is_public) ->
    $.post '/territories/', 'territory[name]': name, 'territory[template]': is_template, 'territory[public]': is_public

  @delete_territory: (id) ->
    $.ajax
      url: '/territories/' + id
      method: 'DELETE'

  @clone_territory: (id, name, is_template, is_public) ->
    $.ajax
      url: '/territories/' + id + '/clone'
      method: 'POST',
      data: 'territory[name]': name, 'territory[template]': is_template, 'territory[public]': is_public

  @update_territory: (id, name, is_template, is_public) ->
    console.log(arguments)
    $.ajax
      url: '/territories/' + id
      method: 'PATCH',
      data: 'territory[name]': name, 'territory[template]': is_template, 'territory[public]': is_public

  @get_node: (id) -> $.get '/nodes/' + id

  @get_edge: (id) -> $.get '/edges/' + id

  @edit_node: (id, title) ->
    $.ajax
      url: '/nodes/' + id
      method: 'PATCH',
      data: 'node[title]': title

  @bulk_update_pos: (nodes_pos) ->
    $.ajax
      url: '/nodes/position'
      method: 'PATCH',
      data: { nodes: nodes_pos }

class Canvas
  constructor: ->
    this.view = $('#main_canvas')[0]
    this.ctx = this.view.getContext '2d'
    this.ctx.canvas.width = $('.right').outerWidth()
    this.ctx.canvas.height = $('.right').outerHeight()

  draw_circle: (pos, radius, fill, type, width, line_color) ->
    this.ctx.beginPath()
    this.ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI)
    this.ctx.fillStyle = if fill then '#ee9999' else '#ffffff'
    this.ctx.fill()
    this.ctx.fillStyle = '#000000'
    this.ctx.lineWidth = width
    this.ctx.strokeStyle = line_color
    switch type
      when 'dotted'
        this.ctx.setLineDash([1, 2])
      when 'dashed'
        this.ctx.setLineDash([5])
    this.ctx.stroke()
    this.ctx.lineWidth = 1
    this.ctx.strokeStyle = '#000'
    this.ctx.setLineDash([])

  draw_line: (x1, y1, x2, y2, color, type) ->
    color ?= '#000'
    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.setLineDash([])
    switch type
      when 'dotted'
        this.ctx.setLineDash([1, 2])
      when 'dashed'
        this.ctx.setLineDash([5])
    this.ctx.strokeStyle = color
    this.ctx.stroke()
    this.ctx.strokeStyle = '#000'
    this.ctx.setLineDash([])

  draw_text: (text, pos) ->
    this.ctx.font = '10px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(text, pos.x, pos.y)

  clear: -> this.ctx.clearRect(0, 0, this.view.width, this.view.height)

class Vector
  constructor: (x, y) ->
    this.x = x
    this.y = y

  make_null: -> this.x = this.y = 0

  add: (v) -> new Vector(this.x + v.x, this.y + v.y)

  sub: (v) -> new Vector(this.x - v.x, this.y - v.y)

  multiply: (scalar) -> new Vector(this.x * scalar, this.y * scalar)

  dot_product: (v) -> this.x * v.x + this.y * v.y

  norm: -> Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))

  normalize: ->
    return new Vector(this.x, this.y) if this.norm() == 0
    new Vector(this.x / this.norm(), this.y / this.norm())

  distance_to: (v) -> Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2))

class NodeGroup
  constructor: (id, name, is_template, is_public) ->
    @id = id
    @name = name
    @template = is_template
    @public = is_public
    @nodes = []
    @color = NodeGroup.getRandomColor()

  @getRandomColor: ->
    letters = '0123456789ABCDEF'
    color = '#'
    for i in [0..5]
      color += letters[Math.floor(Math.random() * 16)]
    return color

class Template
  constructor: (id, name, is_template) ->
    @id = id
    @name = name
    @template = is_template

class Node
  constructor: (data, pos) ->
    this.id = data.id
    this.territory = data.territory
    this.title = data.title
    this.type = data.type
    this.pos = pos || new Vector(10, 10)
    this.velocity = new Vector(0, 0)
    this.force = new Vector(0, 0)
    this.children = []
    this.edges = []

    if (data.x)
      this.pos = new Vector(data.x, data.y)
      this.velocity = new Vector(data.vx, data.vy)
      this.force = new Vector(data.fx, data.fy)

  destroy: -> Api.delete_node(this.id)

  remove_edge: (edge) ->
    this.edges.splice(idx, 1) if (idx = this.edges.indexOf(edge)) != -1

  connect_to: (node) ->
    self = this
    Api.create_edge('Positioning', this.id, node.id)

  disconnect: (node) ->
    for edge in this.edges
      if edge.target.id == node.id
        this.remove_edge edge
        return Api.delete_edge(edge.id)
      
    for edge in node.edges
      if edge.target.id == this.id
        node.remove_edge edge
        return Api.delete_edge(edge.id)

  has_child: (node) ->
    this.edges.find (val) ->
      val.target.id == node.id

class Edge
  constructor: (id, category, source, target) ->
    @id = id
    @category = category
    @source = source
    @target = target

  distance_to: (v) ->
    a = v.sub(@source.pos)
    b = @target.pos.sub(@source.pos)
    projection = b.multiply(a.dot_product(b) / Math.pow(b.norm(), 2))

    if projection.norm() > b.norm() ||
       projection.normalize().sub(b.normalize()).norm() > 1
      distance = 1000000
    else
      distance = a.sub(projection).norm()

class Physics
  @repulsion_constant = 10
  @attraction_constant = 0.0001
  @friction_constant = 0.01

  @add_repulsive_force: (node, v, force) ->
    distance_squared = Math.pow(node.pos.x - v.x, 2) + Math.pow(node.pos.y - v.y, 2)
    repel_vector = node.pos.sub(v).normalize().multiply(force / (distance_squared + 0.00001))
    node.force = node.force.add repel_vector

  @add_attractive_force: (node, v, force) ->
    scalar = force * node.pos.distance_to(v)
    attraction_vector = v.sub(node.pos).normalize().multiply(scalar)
    node.force = node.force.add attraction_vector

  @calculate_repulsive_forces: (node, nodes) ->
    for key, n of nodes
      continue if n.id == node.id
      @add_repulsive_force node, n.pos, @repulsion_constant

  @calculate_elastic_forces: (node) ->
    for key, n of node.edges
      @add_attractive_force node, n.target.pos, @attraction_constant
      @add_attractive_force n.target, node.pos, @attraction_constant

  @calculate_constraint_forces: (node, width, height) ->
    dist = 2
    constraint_distances = {
      up:    new Vector(node.pos.x, height + dist),
      down:  new Vector(node.pos.x, -dist),
      left:  new Vector(-dist, node.pos.y),
      right: new Vector(width + dist, node.pos.y)
    }

    for key, val of constraint_distances
      @add_repulsive_force node, val, @repulsion_constant

    # Central repelling force.
    # center = new Vector(width * 0.5, height * 0.5)
    # @add_repulsive_force node, center, @repulsion_constant * 0.01

  @calculate_friction_force: (node) ->
    friction_vector = node.velocity.multiply(-@friction_constant)
    node.force = node.force.add(friction_vector)

  @calculate_forces: (nodes, width, height) ->
    for key, node of nodes
      this.calculate_repulsive_forces node, nodes
      this.calculate_elastic_forces node
      this.calculate_constraint_forces node, width, height
      this.calculate_friction_force node

  @update_motion: (nodes) ->
    for key, node of nodes
      node.velocity = node.velocity.add(node.force)
      node.pos = node.pos.add(node.velocity)
      node.force.make_null()

class Graph
  territories = {}
  nodes = {}
  edges = {}
  templates = {}

  selected_node_id: null
  dragging: false
  self = null
  ui: null

  constructor: (canvas) ->
    this.canvas = canvas
    self = this

    $('#main_canvas').on
      mousedown: (e) ->
        offset = $(this).offset()
        event = { x: e.pageX - offset.left, y: e.pageY - offset.top }
        self.canvas_mousedown event
      mouseup: -> self.dragging = false
      mouseleave: -> self.dragging = false
      mousemove: (e) ->
        offset = $(this).offset()
        event = { x: e.pageX - offset.left, y: e.pageY - offset.top }
        self.canvas_mousemove event

  random_pos: () -> new Vector(Math.random() * this.canvas.view.width,
                               Math.random() * this.canvas.view.height)

  get_territories: -> return territories
  get_nodes: -> return nodes
  get_edges: -> return edges
  get_templates: -> return templates
  set_ui: (ui) -> @ui = ui

  remove_node: (node) ->
    for key, edge of edges
      if edge.source.id == node.id || edge.target.id == node.id
        delete edges[edge.id]
    delete nodes[node.id]

  remove_territory: (ng) ->
    for key, node of nodes
      if node.territory.id == ng.id
        this.remove_node node
    delete territories[ng.id]

  limit_to_bounds: (node) ->
    node.pos.x = node.pos.x.clamp 1, this.canvas.view.width - 1
    node.pos.y = node.pos.y.clamp 1, this.canvas.view.height - 1

  create_territory: (ng) ->
    new_ng = new NodeGroup(ng.id, ng.name, ng.template)
    territories[ng.id] = new_ng

  create_node: (node) ->
    ng = territories[node.territory_id]
    node.territory = ng
    new_node = new Node(node, self.random_pos())
    nodes[node.id] = new_node
    ng.nodes.push new_node

  load: ->
    fn = (data) ->
      territories = {}
      nodes = {}
      edges = {}
      templates = {}

      if data.territories
        for ng in data.territories
          self.create_territory(ng)
      else
        self.create_territory(data.territory)

      for node in data.nodes
        self.create_node(node)

      for edge in data.edges
        source = nodes[edge.source_id]
        target = nodes[edge.target_id]
        new_edge = new Edge(edge.id, edge.category, source, target)
        edges[edge.id] = new_edge
        source.edges.push new_edge

      if data.templates
        for template in data.templates
          new_template = new Template(template.id, template.name, true)
          templates[template.id] = new_template

    matches = window.location.href.match(/#(.+)/)
   
    return Api.get_graph().done fn if matches == null
    return Api.show_graph(matches[1]).done fn

  refresh_canvas: ->
    this.canvas.clear()
    for key, edge of edges
      color = '#000000'
      color = '#ee9999' if (this.ui.selected_element == edge)

      type = 'normal'
      switch edge.category
        when 'Positioning' then type = 'dotted'
        when 'Relationship' then type = 'dashed'

      this.canvas.draw_line edge.source.pos.x, edge.source.pos.y,
      edge.target.pos.x, edge.target.pos.y, color, type

    for key, node of nodes
      selected = this.ui.selected_element == node
      if this.ui.selected_element instanceof NodeGroup
        selected = selected || node.territory == this.ui.selected_element
 
      line_width = 1
      type = 'normal'
      switch node.type
        when 'TaskNode'     then type = 'dashed'
        when 'TextNode'     then type = 'dotted'
        when 'LinkNode'     then type = 'dashed'; line_width = 3
        when 'WormHoleNode' then line_width = 3

      this.canvas.draw_circle node.pos, 10, selected, type, line_width, node.territory.color
      this.canvas.draw_text node.id, node.pos.add(new Vector(0, 4))

  update_position: ->
    Physics.calculate_forces nodes, this.canvas.view.width, this.canvas.view.height
    this.ui.update_node_position()
    Physics.update_motion nodes
    this.limit_to_bounds(node) for key, node of nodes
    this.refresh_canvas()

  canvas_mousedown: (e) ->
    this.dragging = true
    for key, node of nodes
      if node.pos.distance_to(new Vector(e.x, e.y)) < 10
        this.ui.select_element node
        return

    for key, edge of edges
      dist = edge.distance_to(new Vector(e.x, e.y))
      if edge.distance_to(new Vector(e.x, e.y)) < 10
        this.ui.select_element edge
        return

  canvas_mousemove: (e) ->
    return if !this.dragging
    return if !(this.ui.selected_element instanceof Node)

    node = this.ui.selected_element
    node.pos = new Vector(e.x, e.y)
    node.velocity.make_null()
    node.force.make_null()

    for key, n of nodes
      if node.pos.distance_to(n.pos) < 20 && n.id != node.id
        if !node.has_child(n) && !n.has_child(node)
          node.connect_to(n).done (data) ->
            edge = new Edge(data.id, data.category, node, n)
            node.edges.push edge
            edges[data.id] = edge
            self.ui.select_element(edge)
        else
          node.disconnect(n).done (data) ->
            delete edges[data.id]

        this.dragging = false
        break

  selected_node: -> nodes[this.selected_node_id]

  get_node: (id) -> nodes[id]
  get_territory: (id) -> territories[id]
  get_edge: (id) -> edges[id]

  save_nodes_position: ->
    nodes_pos = []
    for key, n of nodes
      nodes_pos.push {
        id: Number(key),
        x: n.pos.x,
        y: n.pos.y,
        vx: n.velocity.x,
        vy: n.velocity.y,
        fx: n.force.x,
        fy: n.force.y
      }

    Api.bulk_update_pos(nodes_pos).done (data) ->
      console.log data

class Ui
  settings: false
  creating: false
  selected_tab_num: -1
  selected_element: null
  tabs: []
  self = null

  constructor: (graph) ->
    self = @
    @graph = graph

  init: ->
    @new_territory = $('#new_territory')
    @new_node = $('#new_node')
    @new_edge = $('#new_edge')
    @toolbar = {}
    @toolbar['refresh'] = $('#toolbar\\[refresh\\]')
    @toolbar['settings'] = $('#toolbar\\[settings\\]')
    @toolbar['save'] = $('#toolbar\\[save\\]')
    @tabs[0] = $('#tab\\[territories\\]')
    @tabs[1] = $('#tab\\[nodes\\]')
    @tabs[2] = $('#tab\\[edges\\]')
    @tabs[3] = $('#tab\\[templates\\]')
    @tab_content = $('#tab\\[content\\]')
    @properties = {}
    @properties['content'] = $('#properties\\[content\\]')
    @properties['territory'] = $('#properties\\[territory\\]')
    @properties['territory']['name'] = $('#properties\\[territory\\]\\[name\\]')
    @properties['territory']['is_template'] = $('#properties\\[territory\\]\\[is_template\\]')
    @properties['territory']['nodes'] = $('#properties\\[territory\\]\\[nodes\\]')
    @properties['territory']['nodes_container'] = $('#properties\\[territory\\]\\[nodes_container\\]')
    @properties['territory']['template_container'] = $('#properties\\[territory\\]\\[template_container\\]')
    @properties['territory']['template'] = $('#properties\\[territory\\]\\[template\\]')
    @properties['territory']['public'] = $('#properties\\[territory\\]\\[public\\]')
    @properties['node'] = $('#properties\\[node\\]')
    @properties['node']['title'] = $('#properties\\[node\\]\\[title\\]')
    @properties['node']['type'] = $('#properties\\[node\\]\\[type\\]')
    @properties['node']['pos'] = $('#properties\\[node\\]\\[pos\\]')
    @properties['node']['x'] = $('#properties\\[node\\]\\[x\\]')
    @properties['node']['y'] = $('#properties\\[node\\]\\[y\\]')
    @properties['node']['vx'] = $('#properties\\[node\\]\\[vx\\]')
    @properties['node']['vy'] = $('#properties\\[node\\]\\[vy\\]')
    @properties['node']['fx'] = $('#properties\\[node\\]\\[fx\\]')
    @properties['node']['fy'] = $('#properties\\[node\\]\\[fy\\]')
    @properties['node']['territory'] = $('#properties\\[node\\]\\[territory\\]')
    @properties['node']['edges'] = $('#properties\\[node\\]\\[edges\\]')
    @properties['node']['edges_container'] = $('#properties\\[node\\]\\[edges_container\\]')
    @properties['category_node'] = $('#properties\\[category_node\\]')
    @properties['category_node']['description'] = $('#properties\\[category_node\\]\\[description\\]')
    @properties['task_node'] = $('#properties\\[task_node\\]')
    @properties['task_node']['description'] = $('#properties\\[task_node\\]\\[description\\]')
    @properties['task_node']['start_date'] = $('#properties\\[task_node\\]\\[start_date\\]')
    @properties['task_node']['end_date'] = $('#properties\\[task_node\\]\\[end_date\\]')
    @properties['text_node'] = $('#properties\\[text_node\\]')
    @properties['text_node']['text'] = $('#properties\\[text_node\\]\\[text\\]')
    @properties['link_node'] = $('#properties\\[link_node\\]')
    @properties['link_node']['link'] = $('#properties\\[link_node\\]\\[link\\]')
    @properties['worm_hole_node'] = $('#properties\\[worm_hole_node\\]')
    @properties['worm_hole_node']['target_territory_id'] = $('#properties\\[worm_hole_node\\]\\[target_territory_id\\]')
    @properties['edge'] = $('#properties\\[edge\\]')
    @properties['edge']['category'] = $('#properties\\[edge\\]\\[category\\]')
    @properties['edge']['source'] = $('#properties\\[edge\\]\\[source\\]')
    @properties['edge']['target'] = $('#properties\\[edge\\]\\[target\\]')
    @properties['create'] = $('#properties\\[create\\]')
    @properties['cancel'] = $('#properties\\[cancel\\]')
    @properties['update'] = $('#properties\\[update\\]')
    @properties['delete'] = $('#properties\\[delete\\]')
    @properties['settings'] = $('#properties\\[settings\\]')
    @properties['settings']['elastic'] = $('#properties\\[settings\\]\\[elastic\\]')
    @properties['settings']['electrostatic'] = $('#properties\\[settings\\]\\[electrostatic\\]')
    @properties['settings']['friction'] = $('#properties\\[settings\\]\\[friction\\]')

    @new_territory.on('click', { self: @ }, (e) -> e.data.self.enable_new_territory_form())
    @new_node.on('click', { self: @ }, (e) -> e.data.self.enable_new_node_form())
    @new_edge.on('click', { self: @ }, (e) -> e.data.self.enable_new_edge_form())
    @properties['create'].on('click', { self: @ }, (e) -> e.data.self.create_element())
    @properties['update'].on('click', { self: @ }, (e) -> e.data.self.update_element())
    @properties['cancel'].on('click', { self: @ }, (e) -> e.data.self.cancel_creation())
    @properties['delete'].on('click', { self: @ }, (e) -> e.data.self.delete_element())
    @properties['node']['type'].on('change', { self: @ }, (e) ->
      e.data.self.update_node_type()
    )

    tab.on('click', { self: @, pos: i }, (e) ->
      e.data.self.select_tab e.data.pos) for tab, i in @tabs

    @toolbar['refresh'].on('click', { self: @ }, (e) ->
      e.data.self.graph.load().done ->
        e.data.self.select_tab(-1)
    )

    @toolbar['settings'].on('click', { self: @ }, (e) ->
      self.selected_tab_num = -1
      self.selected_element = null
      self.settings = true
      self.creating = null
      e.data.self.update()
    )

    @toolbar['save'].on('click', { self: @ }, (e) ->
      self.graph.save_nodes_position()
    )

    @update()

  cancel_creation: ->
    @creating = false
    @update()

  get_node_data: ->
    data = {}
    data['node[title]'] = @properties['node']['title'].val()
    data['node[type]'] = @properties['node']['type'].val()
    data['node[territory_id]'] = @properties['node']['territory'].val()
    data['node[x]'] = @properties['node']['x'].html()
    data['node[y]'] = @properties['node']['y'].html()
    data['node[vx]'] = @properties['node']['vx'].html()
    data['node[vy]'] = @properties['node']['vy'].html()
    data['node[fx]'] = @properties['node']['fx'].html()
    data['node[fy]'] = @properties['node']['fy'].html()
    switch data['node[type]']
      when 'CategoryNode'
        data['node[description]'] = @properties['category_node']['description'].val()
        break
      when 'TaskNode'
        data['node[description]'] = @properties['task_node']['description'].val()
        data['node[start_date]'] = @properties['task_node']['start_date'].val()
        data['node[end_date]'] = @properties['task_node']['end_date'].val()
        break
      when 'TextNode'
        data['node[text]'] = @properties['text_node']['text'].val()
        break
      when 'LinkNode'
        data['node[link]'] = @properties['link_node']['link'].val()
        break
      when 'WormHoleNode'
        data['node[target_territory_id]'] = @properties['worm_hole_node']['target_territory_id'].val()
        break

    console.log data
    return data

  create_element: ->
    switch @creating
      when 'territory'
        name = @properties['territory']['name'].val()
        is_template = @properties['territory']['is_template'].prop('checked')
        is_public = @properties['territory']['public'].prop('checked')
        template_id = @properties['territory']['template'].val()

        if Number(template_id) == -1
          Api.create_territory(name, is_template, is_public).done (data) ->
            self.graph.create_territory(data)
            self.creating = false
            self.select_element self.graph.get_territory(data.id)
        else
          Api.clone_territory(template_id, name, is_template, is_public).done (data) ->
            territory_id = data.id
            self.graph.load().always (data) ->
              self.creating = false
              self.select_element self.graph.get_territory(territory_id)
      when 'node'
        data = @get_node_data()
        Api.create_node(data).done (data) ->
          self.graph.create_node(data)
          self.select_element self.graph.get_node(data.id)
      when 'edge'
        category = @properties['edge']['category'].val()
        source_id = @properties['edge']['source'].val()
        target_id = @properties['edge']['target'].val()
        Api.create_edge(category, source_id, target_id).done (data) ->
          id = data.id
          self.graph.load().always (data) ->
            self.select_element self.graph.get_edge(id)
          

  delete_element: ->
    switch @selected_element.constructor.name
      when 'NodeGroup'
        Api.delete_territory(@selected_element.id).done (data) ->
          self.graph.remove_territory self.selected_element
          self.select_tab 0
      when 'Node'
        Api.delete_node(@selected_element.id).done (data) ->
          self.graph.remove_node self.selected_element
          self.select_tab 1
      when 'Edge'
        Api.delete_edge(@selected_element.id).done (data) ->
          edge = self.selected_element
          edge.source.remove_edge(edge)
          delete self.graph.get_edges()[edge.id]
          self.select_tab 2

  update_element: ->
    switch @selected_element.constructor.name
      when 'NodeGroup'
        name = @properties['territory']['name'].val()
        is_template = @properties['territory']['is_template'].prop('checked')
        is_public = @properties['territory']['public'].prop('checked')
        Api.update_territory(@selected_element.id, name, is_template, is_public).done (data) ->
          self.selected_element.name = name
          self.selected_element.template = data.template
          self.select_element self.graph.get_territory(data.id)
      when 'Node'
        node_data = @get_node_data()
        Api.update_node(@selected_element.id, node_data).done((data) ->
          self.selected_element.type = node_data['node[type]']
          self.selected_element.title = data.title
          self.selected_element.territory = self.graph.get_territory(data.territory_id)
          self.select_element self.graph.get_node(data.id)
        ).error (err) ->
          console.log err
      when 'Edge'
        edge_id = @selected_element.id
        source_id = @properties['edge']['source'].val()
        target_id = @properties['edge']['target'].val()
        category = @properties['edge']['category'].val()
        Api.update_edge(edge_id, source_id, target_id, category).done (data) ->
          edge = self.selected_element
          edge.category = data.category
          edge.source.remove_edge edge
          edge.source = self.graph.get_nodes()[data.source_id]
          edge.source.edges.push edge
          edge.target = self.graph.get_nodes()[data.target_id]
          self.select_element self.graph.get_edge(edge_id)
            
      when 'Template' then @selected_tab_num = 3

  update_list: ->
    list = null
    switch @selected_tab_num
      when 0 then list = @graph.get_territories()
      when 1 then list = @graph.get_nodes()
      when 2 then list = @graph.get_edges()
      when 3 then list = @graph.get_templates()
   
    @tab_content.empty()
    for key, el of list
      html = null
      switch el.constructor.name
        when 'NodeGroup' then html = $('<li>(' + el.id + ') ' + el.name + '</li>')
        when 'Node' then html = $('<li>(' + el.id + ') ' + el.title + '</li>')
        when 'Edge' then html = $('<li>' + el.source.id + ' -> ' + el.target.id + '</li>')
        when 'Template' then html = $('<li>' + el.name + '</li>')
    
      html.toggleClass('active', true) if el == @selected_element
      html.on('click', { self: @, obj: el }, (e) ->
        e.data.self.select_element e.data.obj)

      @tab_content.append html
     
  update_properties_buttons: (flag) ->
    if flag
      @properties['create'].css('display', 'inline-block')
      @properties['cancel'].css('display', 'inline-block')
      @properties['update'].css('display', 'none')
      @properties['delete'].css('display', 'none')
    else
      @properties['create'].css('display', 'none')
      @properties['cancel'].css('display', 'none')
      @properties['update'].css('display', 'inline-block')
      @properties['delete'].css('display', 'inline-block')

  update_territory_properties: ->
    Api.get_territory(@selected_element.id).done (data) ->
      self.properties['territory'].css('display', 'block')
      self.properties['territory']['name'].val(data.territory.name)
      self.properties['territory']['is_template'].prop('checked', data.territory.template)
      self.properties['territory']['public'].prop('checked', data.territory.public)
      self.properties['territory']['nodes_container'].css('display', 'block')
      self.properties['territory']['nodes'].empty()
      self.properties['territory']['template_container'].css('display', 'none')
      self.properties['territory']['template'].css('display', 'none')
      for key, node of data.nodes
        html = $('<li>(' + node.id + ') ' + node.title + '</li>')
        html.on('click', { self: self, obj: self.graph.get_node(node.id) }, (e) ->
          e.data.self.select_element e.data.obj)
        self.properties['territory']['nodes'].append html
      self.properties['content'].css('display', 'block')

  clean_properties: ->
    @properties['node']['title'].val('')
    @properties['node']['type'].val('CategoryNode')
    self.properties['node']['territory'].empty()
    for key, ng of self.graph.get_territories()
      html = $('<option value="' + ng.id + '">' + ng.name + '</option>')
      @properties['node']['territory'].append html
    @properties['category_node']['description'].val('')
    @properties['task_node']['description'].val('')
    @properties['task_node']['start_date'].val('')
    @properties['task_node']['end_date'].val('')
    @properties['text_node']['text'].val('')
    @properties['link_node']['link'].val('')
    @properties['worm_hole_node']['target_territory_id'].empty()
    for key, territory of self.graph.get_territories()
      html = $('<option value="' + territory.id + '">(' + territory.id + ') ' + territory.name + '</option>')
      self.properties['worm_hole_node']['target_territory_id'].append html
    @properties['worm_hole_node']['target_territory_id'].val('')

    @properties['edge']['category'].val('Positioning')
    @properties['edge']['source'].val('')
    @properties['edge']['target'].val('')
    @properties['edge']['source'].empty()
    @properties['edge']['target'].empty()
    for key, node of self.graph.get_nodes()
      html = $('<option value="' + node.id + '">(' + node.id + ') ' + node.title + '</option>')
      self.properties['edge']['source'].append html.clone()
      self.properties['edge']['target'].append html

  update_node_properties: ->
    @clean_properties()
    Api.get_node(@selected_element.id).done (data) ->
      self.properties['node'].css('display', 'block')
      self.properties['node']['pos'].css('display', 'block')
      self.properties['node']['title'].val(data.title)
      self.properties['node']['type'].val(data.type)
      self.properties['node']['territory'].val(self.selected_element.territory.id)

      self.update_node_type()
      self.properties['category_node']['description'].val(data.description)
      self.properties['task_node']['description'].val(data.description)
      self.properties['task_node']['start_date'].val(data.start_date)
      self.properties['task_node']['end_date'].val(data.end_date)
      self.properties['text_node']['text'].val(data.text)
      self.properties['link_node']['link'].val(data.link)
      self.properties['worm_hole_node']['target_territory_id'].val(data.target_territory_id)

      self.properties['node']['edges_container'].css('display', 'block')
      self.properties['node']['edges'].empty()
      for edge in self.selected_element.edges
        html = $('<li>(' + edge.target.id + ') ' + edge.target.title + '</li>')
        html.on('click', { self: self, obj: edge }, (e) ->
          e.data.self.select_element e.data.obj)
        self.properties['node']['edges'].append html
      self.properties['content'].css('display', 'block')

  update_edge_properties: ->
    @clean_properties()
    Api.get_edge(@selected_element.id).done (data) ->
      self.properties['edge'].css('display', 'block')
      self.properties['edge']['category'].val(data.category)
      self.properties['edge']['source'].val(data.source_id)
      self.properties['edge']['target'].val(data.target_id)
      self.properties['content'].css('display', 'block')

  update_create_territory: ->
    @properties['territory'].css('display', 'block')
    @properties['territory']['nodes_container'].css('display', 'none')
    @properties['territory']['name'].val('')
    @properties['territory']['is_template'].prop('checked', false)
    @properties['territory']['public'].prop('checked', false)
    @properties['territory']['template'].css('display', 'block')
    @properties['territory']['template'].empty()

    html = $('<option value="-1">None</option>')
    @properties['territory']['template_container'].css('display', 'block')
    @properties['territory']['template'].append html
    @properties['territory']['template'].val -1

    for key, ng of @graph.get_territories()
      html = $('<option value="' + ng.id + '">' + ng.name + '</option>')
      @properties['territory']['template'].append html

    for key, ng of @graph.get_templates()
      html = $('<option value="' + ng.id + '">' + ng.name + '</option>')
      @properties['territory']['template'].append html

    @properties['content'].css('display', 'block')
    @update_properties_buttons true

  update_create_node: ->
    @properties['node'].css('display', 'block')
    @properties['node']['edges_container'].css('display', 'none')
    @properties['content'].css('display', 'block')
    @properties['node']['pos'].css('display', 'none')
    @clean_properties()
    @update_node_type()
    @update_properties_buttons true

  update_create_edge: ->
    @properties['edge'].css('display', 'block')
    @properties['content'].css('display', 'block')
    @clean_properties()
    @update_properties_buttons true

  update_settings: ->
    @properties['settings'].css('display', 'block')
    @properties['settings']['elastic'].val(Physics.attraction_constant)
    @properties['settings']['electrostatic'].val(Physics.repulsion_constant)
    @properties['settings']['friction'].val(Physics.friction_constant)

    @properties['settings']['elastic'].on('change', (e) ->
      Physics.attraction_constant = $(this).val())
    @properties['settings']['electrostatic'].on('change', (e) ->
      Physics.repulsion_constant = $(this).val())
    @properties['settings']['friction'].on('change', (e) ->
      Physics.friction_constant = $(this).val())

    @properties['content'].css('display', 'block')
    @properties['create'].css('display', 'none')
    @properties['cancel'].css('display', 'none')
    @properties['update'].css('display', 'none')
    @properties['delete'].css('display', 'none')

  update_properties: ->
    @properties['content'].css('display', 'none')

    @properties['territory'].css('display', 'none')
    @properties['node'].css('display', 'none')
    @properties['edge'].css('display', 'none')
    @properties['settings'].css('display', 'none')

    if @creating
      setTimeout(->
        switch self.creating
          when 'territory' then return self.update_create_territory()
          when 'node' then return self.update_create_node()
          when 'edge' then return self.update_create_edge()
      , 100)

    if @settings
      return @update_settings()

    if !@selected_element
      return

    @update_properties_buttons false
    switch @selected_element.constructor.name
      when 'NodeGroup' then @update_territory_properties()
      when 'Node' then @update_node_properties()
      when 'Edge' then @update_edge_properties()

  update: ->
    @update_list()
    @update_properties()
    tab.toggleClass('active', false) for tab in @tabs
    if @selected_tab_num != -1
      @tabs[@selected_tab_num].toggleClass('active', true)

  select_tab: (i) ->
    @selected_tab_num = i
    @selected_element = null
    @settings = false
    @creating = null
    @update()

  select_element: (el) ->
    @settings = false
    @creating = null
    @selected_element = el
    switch el.constructor.name
      when 'NodeGroup' then @selected_tab_num = 0
      when 'Node' then @selected_tab_num = 1
      when 'Edge' then @selected_tab_num = 2
      when 'Template' then @selected_tab_num = 3
    @update()

  update_node_type: () ->
    type = @properties['node']['type'].val()
    @properties['category_node'].css('display', 'none')
    @properties['task_node'].css('display', 'none')
    @properties['text_node'].css('display', 'none')
    @properties['link_node'].css('display', 'none')
    @properties['worm_hole_node'].css('display', 'none')

    switch type
      when 'CategoryNode'
        @properties['category_node'].css('display', 'block')
      when 'TaskNode'
        @properties['task_node'].css('display', 'block')
      when 'TextNode'
        @properties['text_node'].css('display', 'block')
      when 'LinkNode'
        @properties['link_node'].css('display', 'block')
      when 'WormHoleNode'
        @properties['worm_hole_node'].css('display', 'block')

  update_node_position: ->
    return if !@selected_element
    if @selected_element.constructor.name == 'Node'
      @properties['node']['x'] .html Number(@selected_element.pos.x).toFixed(5)
      @properties['node']['y'] .html Number(@selected_element.pos.y).toFixed(5)
      @properties['node']['vx'].html Number(@selected_element.velocity.x).toFixed(5)
      @properties['node']['vy'].html Number(@selected_element.velocity.y).toFixed(5)
      @properties['node']['fx'].html Number(@selected_element.force.x).toFixed(5)
      @properties['node']['fy'].html Number(@selected_element.force.y).toFixed(5)

  enable_new_territory_form: ->
    @selected_tab_num = -1
    @selected_element = null
    @creating = 'territory'
    @settings = false
    @update()

  enable_new_node_form: ->
    @selected_tab_num = -1
    @selected_element = null
    @creating = 'node'
    @settings = false
    @update()

  enable_new_edge_form: ->
    @selected_tab_num = -1
    @selected_element = null
    @creating = 'edge'
    @settings = false
    @update()

class App
  run: ->
    graph = new Graph(new Canvas)
    ui = new Ui(graph)
    ui.init()
    graph.set_ui ui

    setInterval () ->
      graph.update_position()
    , 10

    $('#create_node').on 'click': -> graph.create_node()
    $('#edit_node').on   'click': -> graph.edit_selected_node()
    $('#delete_node').on 'click': -> graph.delete_selected_node()
    $('#refresh').on     'click': -> graph.load()

    graph.load()

    window.onhashchange = () ->
      window.location.reload()

document.App = App
