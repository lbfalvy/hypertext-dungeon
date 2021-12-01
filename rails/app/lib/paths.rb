class Paths
  def self.common(path1, path2)
    index = -1 # The first increment will bring it up to 0
    common = path1.take_while { |elem| path2[index += 1] == elem }
    return [
      common,
      path1[common.length..-1],
      path2[common.length..-1]
    ]
  end
end