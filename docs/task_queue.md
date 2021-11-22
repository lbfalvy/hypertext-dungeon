# Description

Program expressed as a series of tasks that enqueue one another. A task has one method, "execute", which receives the task queue as its argument. Task has a static method, to_task, which takes a single closure or task and returns a task. Enqueue returns the task itself so that you can use it in a monadic API like this:
q.enq(Task.all(
    load('foo.txt'),
    load
))
.then(do |file|

end)