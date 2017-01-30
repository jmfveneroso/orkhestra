class Node < ApplicationRecord
  # Returns the allowed node types.
  def self.types
    %w(CategoryNode TaskNode TextNode LinkNode)
  end

  validates :title, presence: true, length: { maximum: 255 }
  validates :type, presence: true, inclusion: { in: self.types,
    message: "%{value} is not a valid type" }
  validate :validate_node_group_id

  belongs_to :node_group
  has_one :user, :through => :node_group
  has_many(:edges, :foreign_key => :source_id, :dependent => :destroy)
  has_many(:reverse_edges, :class_name => :Edge,
     :foreign_key => :target_id, :dependent => :destroy)
  has_many :nodes, :through => :edges, :source => :target

  def erase_type_attributes
    case self.type
      when 'CategoryNode' 
        self.start_date = nil
        self.end_date = nil
        self.text = nil
        self.link = nil
      when 'TaskNode' 
        self.text = nil
        self.link = nil
      when 'TextNode' 
        self.start_date = nil
        self.end_date = nil
      when 'LinkNode' 
        self.start_date = nil
        self.end_date = nil
    end
  end

  # Updates the position of multiple nodes by calling a db stored procedure.
  # @param json an array of nodes and their positions in JSON format.
  # @return [void]
  def self.bulk_update_pos(json)
    # Non existent node ids and fields different from x and y will 
    # simply be ignored.
    query = "select bulk_update_node_pos('#{json}'::json)"
    ActiveRecord::Base.connection.execute query
  end

  private

    def validate_node_group_id
      errors.add(:node_group_id, "is invalid") unless NodeGroup.
        exists?(self.node_group_id)
    end
end
