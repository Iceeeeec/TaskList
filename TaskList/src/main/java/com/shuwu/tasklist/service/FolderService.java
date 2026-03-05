/**
 * 标题: FolderService
 * 说明: 文件夹服务接口
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.service;

import com.shuwu.tasklist.entity.TaskFolder;
import java.util.List;

public interface FolderService {

    /** 查询用户的文件夹列表 */
    List<TaskFolder> listByUserId(Long userId);

    /** 新建文件夹 */
    void add(Long userId, String name, Integer colorIndex);

    /** 修改文件夹 */
    void update(Long id, Long userId, String name, Integer colorIndex);

    /** 删除文件夹 */
    void delete(Long id, Long userId);
}
