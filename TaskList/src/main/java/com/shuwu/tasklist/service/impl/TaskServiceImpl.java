/**
 * 标题: TaskServiceImpl
 * 说明: 任务服务实现 - 核心业务逻辑
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.shuwu.tasklist.dto.TaskDetailDTO;
import com.shuwu.tasklist.dto.TaskListDTO;
import com.shuwu.tasklist.entity.*;
import com.shuwu.tasklist.mapper.*;
import com.shuwu.tasklist.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskInfoMapper taskInfoMapper;
    private final TaskFolderMapper folderMapper;
    private final TaskTagMapper tagMapper;
    private final TaskTagRelMapper tagRelMapper;
    private final TaskSubtaskMapper subtaskMapper;

    @Override
    public List<TaskListDTO> list(Long userId, String filter, String keyword) {
        LambdaQueryWrapper<TaskInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TaskInfo::getUserId, userId);

        // 筛选条件
        if ("today".equals(filter)) {
            LocalDateTime start = LocalDate.now().atStartOfDay();
            LocalDateTime end = LocalDate.now().atTime(LocalTime.MAX);
            wrapper.between(TaskInfo::getDueDate, start, end);
        } else if ("week".equals(filter)) {
            LocalDateTime start = LocalDate.now().atStartOfDay();
            LocalDateTime end = LocalDate.now().plusDays(7).atTime(LocalTime.MAX);
            wrapper.between(TaskInfo::getDueDate, start, end);
        } else if (filter != null && !filter.isEmpty() && !"all".equals(filter)) {
            // 按文件夹ID筛选
            try {
                Long folderId = Long.parseLong(filter);
                wrapper.eq(TaskInfo::getFolderId, folderId);
            } catch (NumberFormatException ignored) {
            }
        }

        // 搜索关键词
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.and(w -> w.like(TaskInfo::getTitle, keyword)
                    .or().like(TaskInfo::getDescription, keyword));
        }

        // 排序：未完成在前 → 优先级 → 创建时间倒序
        wrapper.orderByAsc(TaskInfo::getCompleted)
                .orderByDesc(TaskInfo::getCreateTime);

        List<TaskInfo> tasks = taskInfoMapper.selectList(wrapper);

        // 组装 DTO
        return tasks.stream().map(this::toListDTO).collect(Collectors.toList());
    }

    @Override
    public TaskDetailDTO detail(Long id, Long userId) {
        TaskInfo task = taskInfoMapper.selectById(id);
        if (task == null || !task.getUserId().equals(userId)) {
            return null;
        }

        TaskDetailDTO dto = new TaskDetailDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setPriority(task.getPriority());
        dto.setDueDate(task.getDueDate());
        dto.setCompleted(task.getCompleted());
        dto.setReminder(task.getReminder());
        dto.setNote(task.getNote());
        dto.setCreateTime(task.getCreateTime());

        // 文件夹
        if (task.getFolderId() != null) {
            TaskFolder folder = folderMapper.selectById(task.getFolderId());
            if (folder != null) {
                TaskListDTO.FolderInfo fi = new TaskListDTO.FolderInfo();
                fi.setId(folder.getId());
                fi.setName(folder.getName());
                fi.setColorIndex(folder.getColorIndex());
                dto.setFolder(fi);
            }
        }

        // 标签
        dto.setTags(getTagsForTask(task.getId()));

        // 子任务
        LambdaQueryWrapper<TaskSubtask> subWrapper = new LambdaQueryWrapper<>();
        subWrapper.eq(TaskSubtask::getTaskId, id).orderByAsc(TaskSubtask::getSortOrder);
        List<TaskSubtask> subtasks = subtaskMapper.selectList(subWrapper);
        dto.setSubtasks(subtasks.stream().map(s -> {
            TaskDetailDTO.SubtaskInfo si = new TaskDetailDTO.SubtaskInfo();
            si.setId(s.getId());
            si.setText(s.getText());
            si.setDone(s.getDone());
            return si;
        }).collect(Collectors.toList()));

        return dto;
    }

    @Override
    @Transactional
    public TaskInfo add(Long userId, String title, String priority, Long folderId,
            List<Long> tagIds, String dueDate) {
        TaskInfo task = new TaskInfo();
        task.setUserId(userId);
        task.setTitle(title);
        task.setPriority(priority != null ? priority : "mid");
        task.setFolderId(folderId);
        task.setCompleted(0);
        task.setReminder(1);

        // 解析截止日期
        if (dueDate != null && !dueDate.isEmpty()) {
            task.setDueDate(LocalDateTime.parse(dueDate,
                    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        }

        taskInfoMapper.insert(task);

        // 插入标签关联
        if (tagIds != null && !tagIds.isEmpty()) {
            for (Long tagId : tagIds) {
                TaskTagRel rel = new TaskTagRel();
                rel.setTaskId(task.getId());
                rel.setTagId(tagId);
                tagRelMapper.insert(rel);
            }
        }

        return task;
    }

    @Override
    public void update(TaskInfo task, Long userId) {
        LambdaUpdateWrapper<TaskInfo> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(TaskInfo::getId, task.getId()).eq(TaskInfo::getUserId, userId);
        taskInfoMapper.update(task, wrapper);
    }

    @Override
    public void toggle(Long id, Long userId) {
        TaskInfo task = taskInfoMapper.selectById(id);
        if (task == null || !task.getUserId().equals(userId))
            return;

        TaskInfo update = new TaskInfo();
        update.setId(id);
        if (task.getCompleted() == 0) {
            update.setCompleted(1);
            update.setCompletedTime(LocalDateTime.now());
        } else {
            update.setCompleted(0);
            update.setCompletedTime(null);
        }
        taskInfoMapper.updateById(update);
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        // 删除任务
        LambdaQueryWrapper<TaskInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TaskInfo::getId, id).eq(TaskInfo::getUserId, userId);
        taskInfoMapper.delete(wrapper);
        // 删除子任务
        LambdaQueryWrapper<TaskSubtask> subWrapper = new LambdaQueryWrapper<>();
        subWrapper.eq(TaskSubtask::getTaskId, id);
        subtaskMapper.delete(subWrapper);
        // 删除标签关联
        LambdaQueryWrapper<TaskTagRel> relWrapper = new LambdaQueryWrapper<>();
        relWrapper.eq(TaskTagRel::getTaskId, id);
        tagRelMapper.delete(relWrapper);
    }

    @Override
    public void clearCompleted(Long userId) {
        LambdaQueryWrapper<TaskInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TaskInfo::getUserId, userId).eq(TaskInfo::getCompleted, 1);
        taskInfoMapper.delete(wrapper);
    }

    @Override
    @Transactional
    public void updateTags(Long taskId, List<Long> tagIds) {
        // 先删除原有关联
        LambdaQueryWrapper<TaskTagRel> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TaskTagRel::getTaskId, taskId);
        tagRelMapper.delete(wrapper);
        // 再插入新关联
        if (tagIds != null) {
            for (Long tagId : tagIds) {
                TaskTagRel rel = new TaskTagRel();
                rel.setTaskId(taskId);
                rel.setTagId(tagId);
                tagRelMapper.insert(rel);
            }
        }
    }

    /** 将 TaskInfo 转为列表 DTO */
    private TaskListDTO toListDTO(TaskInfo task) {
        TaskListDTO dto = new TaskListDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setPriority(task.getPriority());
        dto.setDueDate(task.getDueDate());
        dto.setCompleted(task.getCompleted());

        // 文件夹
        if (task.getFolderId() != null) {
            TaskFolder folder = folderMapper.selectById(task.getFolderId());
            if (folder != null) {
                TaskListDTO.FolderInfo fi = new TaskListDTO.FolderInfo();
                fi.setId(folder.getId());
                fi.setName(folder.getName());
                fi.setColorIndex(folder.getColorIndex());
                dto.setFolder(fi);
            }
        }

        // 标签
        dto.setTags(getTagsForTask(task.getId()));
        return dto;
    }

    /** 获取任务关联的标签列表 */
    private List<TaskListDTO.TagInfo> getTagsForTask(Long taskId) {
        LambdaQueryWrapper<TaskTagRel> relWrapper = new LambdaQueryWrapper<>();
        relWrapper.eq(TaskTagRel::getTaskId, taskId);
        List<TaskTagRel> rels = tagRelMapper.selectList(relWrapper);

        if (rels.isEmpty())
            return new ArrayList<>();

        List<Long> tagIds = rels.stream().map(TaskTagRel::getTagId)
                .collect(Collectors.toList());
        List<TaskTag> tags = tagMapper.selectBatchIds(tagIds);

        return tags.stream().map(t -> {
            TaskListDTO.TagInfo ti = new TaskListDTO.TagInfo();
            ti.setId(t.getId());
            ti.setName(t.getName());
            ti.setColorIndex(t.getColorIndex());
            return ti;
        }).collect(Collectors.toList());
    }
}
