/**
 * 标题: FolderServiceImpl
 * 说明: 文件夹服务实现
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.shuwu.tasklist.entity.TaskFolder;
import com.shuwu.tasklist.entity.TaskInfo;
import com.shuwu.tasklist.mapper.TaskFolderMapper;
import com.shuwu.tasklist.mapper.TaskInfoMapper;
import com.shuwu.tasklist.service.FolderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FolderServiceImpl implements FolderService {

    private final TaskFolderMapper folderMapper;
    private final TaskInfoMapper taskInfoMapper;

    @Override
    public List<TaskFolder> listByUserId(Long userId) {
        LambdaQueryWrapper<TaskFolder> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TaskFolder::getUserId, userId)
                .orderByAsc(TaskFolder::getSortOrder);
        return folderMapper.selectList(wrapper);
    }

    @Override
    public void add(Long userId, String name, Integer colorIndex) {
        TaskFolder folder = new TaskFolder();
        folder.setUserId(userId);
        folder.setName(name);
        folder.setColorIndex(colorIndex != null ? colorIndex : 0);
        // 排序序号取当前最大值+1
        Long count = folderMapper.selectCount(
                new LambdaQueryWrapper<TaskFolder>().eq(TaskFolder::getUserId, userId));
        folder.setSortOrder(count.intValue());
        folderMapper.insert(folder);
    }

    @Override
    public void update(Long id, Long userId, String name, Integer colorIndex) {
        TaskFolder folder = new TaskFolder();
        folder.setId(id);
        folder.setName(name);
        folder.setColorIndex(colorIndex);
        // 确保只能修改自己的
        LambdaUpdateWrapper<TaskFolder> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(TaskFolder::getId, id).eq(TaskFolder::getUserId, userId);
        folderMapper.update(folder, wrapper);
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        // 删除文件夹
        LambdaQueryWrapper<TaskFolder> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TaskFolder::getId, id).eq(TaskFolder::getUserId, userId);
        folderMapper.delete(wrapper);
        // 该文件夹下的任务 folder_id 置 NULL
        LambdaUpdateWrapper<TaskInfo> taskWrapper = new LambdaUpdateWrapper<>();
        taskWrapper.eq(TaskInfo::getFolderId, id).set(TaskInfo::getFolderId, null);
        taskInfoMapper.update(null, taskWrapper);
    }
}
