class MultiHash
    include Enumerable

    def initialize
        @entries = Hash.new
    end

    def add(key, value)
        (@entries[key] ||= Set.new).add(value)
    end

    def add_all(enum)
        enum.each do |key, value|
            add(key, value)
        end
    end

    def delete(key, value)
        @entries[key].delete(value)
    end

    def delete_all(enum)
        enum.each do |key, value|
            delete(key, value)
        end
        tidy
    end

    def first_for(key)
        @entries[key].first
    end

    def shift(key)
        result = @entries[key].first
        delete(key, result)
        result
    end

    def tidy
        @entries.delete_if { |set| set.empty? }
    end

    def each
        @entries.each do |key, set|
            yield(key, set) unless set.empty?
        end
    end
end