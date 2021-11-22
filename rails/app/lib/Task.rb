module Tasks
    class Task
        def execute
            raise NotImplementedError
        end

        def self.to_task(x)
            x and return if x.respond_to? :execute
            ProcTask.new(&x) and return if x.respond_to? :call
            raise ArgumentError.new "Could not convert #{x} to task"
        end
    end

    class BatchTask < Task
        def self.init
            @batch_classes = Hash.new
            @batch_delegates = Hash.new
        end

        def self.batch_classes
            @batch_classes
        end

        def self.batch_delegates
            @batch_delegates
        end

        def self.batch_with(type=nil, has:nil, with:nil)
            raise ArgumentError.new `specified both type and field` if (type and has) or !with
            if type
                @batch_classes[name.to_sym] = with
            else
                @batch_delegates[has.to_sym] = with
            end
        end
    end

    class ProcTask < Task
        def execute(queue)
            rval = @block.call(*@args, **@kwargs)
            if rval == nil
                queue.enq Task.to_task @then.shift until @then.empty?
            else
                until @then.empty?
                    block = @then.shift
                    newblock = { block.call(rval) }
                    queue.enq Task.to_task newblock
                end
            end
        end

        def initialize(*args, **kwargs, &block)
            @block = block
            @args = args
            @kwargs = kwargs
            @then = Array.new
        end

        def then(&block)
            @then.push block
        end
    end

    class TaskQueue
        def initialize
            @tasks = Array.new
        end

        # Add a task to the queue
        def enq(task)
            task = Task.to_task task
            tasks.push task
            return task
        end

        # Run until there are no tasks left
        def empty
            until empty? do
                one
            end
        end

        # Are there tasks in the queue?
        def empty?
            tasks.empty?
        end

        # Execute a single task
        def one
            execute tasks.shift
        end

        protected
            # Process a single task
            # The task is not in the queue at this point
            def execute(task)
                task.execute(self)
            end

            def tasks
                @tasks
            end
    end

    class BatchQueue < TaskQueue
        def initialize
            super
            @fast_queue = TaskQueue.new
            @batch_classes = MultiHash.new
            @batch_delegates = MultiHash.new
        end

        # Add a task
        def enq(task)
            batched = batch task
            if batchable?(batched)
                add_to_batch_index batched
                super(batched)
            else
                @fast_queue.enq(bayched)
            end
            return batched
        end

        # Clear the fast queue, then one from self.
        # priority queue principle
        def empty
            until empty?
                @fast_queue.empty
                execute tasks.shift unless tasks.empty?
            end
        end

        # Are both self and the fast queue empty?
        def empty?
            super and @fast_queue.empty?
        end

        # Run one from the fast queue if possible, self if not.
        def one
            if @fast_queue.empty?
                execute tasks.shift
            else
                @fast_queue.one
            end
        end

        protected
            # remove from batch indices and run task contents
            def execute(task)
                remove_from_batch_index task
                super
            end

            # Combine a task with as many known tasks as possible
            # The argument should not be in the queue at this point
            def batch(task)
                partner = nil
                loop do
                    # find a candidate
                    result = select_batch task
                    break unless result
                    [partner, delegate] = result
                    do
                        # merge the partner with the task
                        task = partner[delegate] task
                    rescue
                        break
                    end
                    remove_from_batch_index partner
                    tasks.delete partner
                end
                return task
            end

            # Find an appropriate candidate for batching
            # does not mutate the indices
            def select_batch(task)
                candidate = @batch_classes.first_for(task.class)
                return candidate if candidate
                @batch_delegates.each do |key, value|
                    return value break if type.respond_to? key
                end
            end

            # Remove all occurences of the task from the batch_* indices
            def remove_from_batch_index(task)
                type = task.class
                to_queue_record = { |key, value| [key, [task, value]] }
                if type.respond_to? :batch_classes
                    @batch_classes.delete_all type.batch_classes.map &to_queue_record
                end
                if type.respond_to? :batch_delegates
                    @batch_delegates.delete_all type.batch_delegates.map &to_queue_record
                end
            end

            def batchable?(task)
                type.respond_to? :batch_classes or type.respond_to? :batch_delegates
            end

            # Add the task to batch_* indices as appropriate
            def add_to_batch_index(task)
                type = task.class
                if type.respond_to? :batch_classes
                    type.batch_classes.each do |key, value|
                        @batch_classes.add(key, [task, value])
                    end
                end
                if type.respond_to? :batch_delegates
                    type.batch_delegates.each do |key, value|
                        @batch_delegates.add(key, [task, value])
                    end
                end
            end
    end
end