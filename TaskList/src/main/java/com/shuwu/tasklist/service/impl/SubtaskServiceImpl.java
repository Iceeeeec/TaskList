/**
 * 标题: SubtaskServiceImpl
 * 说明: 子任务服务实现
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuwu.tasklist.entity.TaskSubtask;
import com.shuwu.tasklist.mapper.TaskSubtaskMapper;
import com.shuwu.tasklist.service.SubtaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SubtaskServiceImpl implements SubtaskService {

    private final TaskSubtaskMapper subtaskMapper;

    @Override
    public void add(Long taskId, String text) {
        TaskSubtask subtask = new TaskSubtask();
        subtask.setTaskId(taskId);
        subtask.setText(text);
        subtask.setDone(0);
        // 排序取当前最大+1
        Long count = subtaskMapper.selectCount(
                new LambdaQueryWrapper<TaskSubtask>().eq(TaskSubtask::getTaskId, taskId));
        subtask.setSortOrder(count.intValue());
        subtaskMapper.insert(subtask);
    }

    @Override
    public void toggle(Long id) {
        TaskSubtask subtask = subtaskMapper.selectById(id);
        if (subtask == null)
            return;

        TaskSubtask update = new TaskSubtask();
        update.setId(id);
        update.setDone(subtask.getDone() == 0 ? 1 : 0);
        subtaskMapper.updateById(update);
    }

    @Override
    public void delete(Long id) {
        subtaskMapper.deleteById(id);
    }
}
