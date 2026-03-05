/**
 * 标题: SubtaskService
 * 说明: 子任务服务接口
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.service;

public interface SubtaskService {

    /** 添加子任务 */
    void add(Long taskId, String text);

    /** 切换子任务完成状态 */
    void toggle(Long id);

    /** 删除子任务 */
    void delete(Long id);
}
